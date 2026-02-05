import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { McitDropdownRef } from '../../../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../../../dropdown/dropdown.service';
import ResizeSensor, { ResizeSensorCallback } from 'css-element-queries/src/ResizeSensor';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { IFavoriteTablePref, ITablePref, McitTablePrefsHttpService } from '../../../services/table-prefs-http.service';
import { McitPopupService } from '../../../services/popup.service';
import { McitCoreConfig } from '../../../helpers/provider.helper';
import { ITableOptions } from '../../table-options';
import { McitUrlHelperService } from '../../../services/url-helper.service';

@Component({
  selector: 'mcit-save-table-dropdown',
  templateUrl: './save-dropdown.component.html',
  styleUrls: ['./save-dropdown.component.scss']
})
export class McitSaveDropdownComponent<E> implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('content', { static: true })
  content: ElementRef;

  favorites$: Observable<IFavoriteTablePref[]>;

  searchBox: string;
  querySubject = new Subject<string>();

  total: number;
  totalPages: number;
  per_page = 5;
  page = 1;

  saveTableModel: ITablePref;

  private tableOptions: ITableOptions<E>;
  private resfreshSaveSearchSubject = new Subject<boolean>();
  private resfreshFavoritesSubject = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();

  private resizeSensor: ResizeSensor;
  private resizeSensorCallback: ResizeSensorCallback;

  private subscriptions: Subscription[] = [];

  constructor(
    private config: McitCoreConfig,
    private dropdownRef: McitDropdownRef<McitSaveDropdownComponent<E>>,
    @Inject(MCIT_DROPDOWN_DATA) data: any,
    private tablePrefsHttpService: McitTablePrefsHttpService,
    private popupService: McitPopupService,
    private urlHelperService: McitUrlHelperService
  ) {
    this.tableOptions = data.tableOptions;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.resfreshSaveSearchSubject
        .asObservable()
        .pipe(
          filter((b) => b),
          switchMap(() =>
            this.tablePrefsHttpService.get(`table-${this.config.app}-${this.tableOptions.save.id}`, 'favorites').pipe(
              catchError((err) => {
                this.popupService.showError();
                return of(null);
              })
            )
          )
        )
        .subscribe((next) => {
          this.saveTableModel = next;
          this.resfreshFavoritesSubject.next(true);
        })
    );

    this.favorites$ = this.resfreshFavoritesSubject.asObservable().pipe(
      filter((b) => b),
      switchMap(
        () =>
          of(this.saveTableModel ? this.saveTableModel.favorites : []).pipe(
            map((vs) => vs.filter((v) => new RegExp(lodash.escapeRegExp(this.searchBox), 'i').test(v.name))),
            catchError((err) => of([]))
          ) as Observable<IFavoriteTablePref[]>
      ),
      tap((res) => {
        this.total = res.length;
        this.totalPages = Math.floor(this.total / this.per_page + (this.total % this.per_page === 0 ? 0 : 1));
      }),
      map((vs) => {
        const s = (this.page - 1) * this.per_page;
        const e = s + this.per_page;
        return vs.slice(s > vs.length ? 0 : s, e > vs.length ? vs.length : e);
      })
    );

    this.resizeSensorCallback = (size) => {
      this.dropdownRef.updatePosition();
    };
    this.resizeSensor = new ResizeSensor(this.content.nativeElement, this.resizeSensorCallback);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.resfreshSaveSearchSubject.next(true);
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());

    this.resizeSensor.detach(this.resizeSensorCallback);
  }

  doClearSearchBox(): void {
    this.searchBox = '';
    this.querySubject.next('');
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doSelectFavorite(favorite: IFavoriteTablePref): void {
    this.dropdownRef.close({ favorite });
  }

  doDeleteFavorite(favorite: IFavoriteTablePref): void {
    const ss = lodash.cloneDeep(this.saveTableModel);
    ss.favorites = ss.favorites.filter((f) => f.name !== favorite.name);

    this.tablePrefsHttpService.save(`table-${this.config.app}-${this.tableOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveSearchSubject.next(true);
      },
      (err) => {
        this.popupService.showError();
      }
    );
  }

  doImport(target: any): void {
    const files = target.files;

    if (files?.[0] != null) {
      const blob = files[0];

      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        try {
          const data = reader.result as string;
          const favorites = JSON.parse(data);

          this.addFavorites(favorites);
        } catch (err) {
          this.popupService.showError();
        }

        target.value = null;
      });
      reader.readAsText(blob, 'UTF8');
    } else {
      target.value = null;
    }
  }

  private addFavorites(favorites: IFavoriteTablePref[]): void {
    const ss = this.saveTableModel ? lodash.cloneDeep(this.saveTableModel) : { favorites: [] };
    ss.favorites = lodash.uniqBy(lodash.concat([], favorites, ss.favorites), (e) => e.name);

    this.tablePrefsHttpService.save(`table-${this.config.app}-${this.tableOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveSearchSubject.next(true);
      },
      (err) => {
        this.popupService.showError();
      }
    );
  }

  doExport(): void {
    this.urlHelperService.download(JSON.stringify(this.saveTableModel.favorites), ' application/json', `export-table-${this.tableOptions.save.id}.json`);
  }
}
