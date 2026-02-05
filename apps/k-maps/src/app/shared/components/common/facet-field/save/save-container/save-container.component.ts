import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { McitCoreConfig } from '../../../helpers/provider.helper';
import { PER_PAGES } from '../../../helpers/pagination.helper';
import { McitPopupService } from '../../../services/popup.service';
import * as lodash from 'lodash';
import { IFavoriteModel, IHistoryModel, marshalFavorite, unmarshalFavorite } from '../../facet-model';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitSettingsModalComponent } from '../settings-modal/settings-modal.component';
import { McitUrlHelperService } from '../../../services/url-helper.service';
import { IFacetOptions } from '../../facet-options';
import { IFacetPref, IFavoriteFacetPref, McitFacetPrefsHttpService } from '../../../services/facet-prefs-http.service';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

@Component({
  selector: 'mcit-save-facet-container',
  templateUrl: './save-container.component.html',
  styleUrls: ['./save-container.component.scss']
})
export class McitSaveContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  facetOptions: IFacetOptions;
  @Input()
  showBack: boolean;

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  select = new EventEmitter();

  histories$: Observable<IHistoryModel[]>;
  favorites$: Observable<IFavoriteModel[]>;

  facetBox: string;
  querySubject = new Subject<string>();

  total: number;
  totalPages: number;
  per_page = 20;
  page = 1;

  saveFacetModel: IFacetPref;

  private resfreshSaveFacetSubject = new Subject<boolean>();
  private resfreshHistoriesSubject = new Subject<boolean>();
  private resfreshFavoritesSubject = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();

  private subscriptions: Subscription[] = [];

  constructor(
    private config: McitCoreConfig,
    private storage: McitStorage,
    private facetPrefsHttpService: McitFacetPrefsHttpService,
    private popupService: McitPopupService,
    private dialog: McitDialog,
    private urlHelperService: McitUrlHelperService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.resfreshSaveFacetSubject
        .asObservable()
        .pipe(
          filter((b) => b && this.facetOptions.save.favorite),
          switchMap(() =>
            this.facetPrefsHttpService.get(`facet-${this.config.app}-${this.facetOptions.save.id}`, 'favorites').pipe(
              map((prefs) => {
                if (prefs) {
                  prefs.favorites = prefs.favorites?.map((favorite) => unmarshalFavorite(favorite));
                }
                return prefs;
              }),
              catchError((err) => {
                this.popupService.showError();
                return of(null);
              })
            )
          )
        )
        .subscribe((next) => {
          this.saveFacetModel = next;

          this.resfreshFavoritesSubject.next(true);
        })
    );

    this.histories$ = this.resfreshHistoriesSubject.asObservable().pipe(
      filter((b) => b),
      switchMap(
        () =>
          this.storage.get(`facet-history-${this.facetOptions.save.id}`).pipe(
            map((res) => (res ? res : [])),
            catchError((err) => of([]))
          ) as Observable<IHistoryModel[]>
      )
    );

    this.favorites$ = this.resfreshFavoritesSubject.asObservable().pipe(
      filter((b) => b),
      switchMap(
        () =>
          of(this.saveFacetModel ? this.saveFacetModel.favorites : []).pipe(
            map((vs) => vs.filter((v) => new RegExp(lodash.escapeRegExp(this.facetBox), 'i').test(v.name))),
            catchError((err) => of([]))
          ) as Observable<IFavoriteModel[]>
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

    this.subscriptions.push(
      this.querySubject
        .asObservable()
        .pipe(debounceTime(300))
        .subscribe((next) => this.resfreshFavoritesSubject.next(true))
    );

    this.subscriptions.push(
      this.paginationSubject
        .asObservable()
        .pipe(
          map((p) => ({
            page: p.page < 1 ? 1 : p.page,
            per_page: PER_PAGES.indexOf(p.per_page) ? p.per_page : 10
          })),
          distinctUntilChanged(),
          tap((p) => {
            this.page = p.page;
            this.per_page = p.per_page;
          })
        )
        .subscribe((next) => this.resfreshFavoritesSubject.next(true))
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.resfreshHistoriesSubject.next(true);
      this.resfreshSaveFacetSubject.next(true);
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doClose(): void {
    this.select.emit(null);
  }

  doSelectHistory(history: IHistoryModel): void {
    this.select.emit({ history });
  }

  doDeleteHistory(history: IHistoryModel): void {
    const key = `facet-history-${this.facetOptions.save.id}`;
    this.storage
      .get(key)
      .pipe(
        switchMap((ls) => {
          const res = ls ? ls.filter((l) => l.id !== history.id) : [];
          return this.storage.set(key, res);
        })
      )
      .subscribe((next) => {
        this.resfreshHistoriesSubject.next(true);
      });
  }

  doClearFacetBox(): void {
    this.facetBox = '';
    this.querySubject.next('');
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doSelectFavorite(favorite: IFavoriteModel): void {
    this.select.emit({ favorite });
  }

  doDeleteFavorite(favorite: IFavoriteModel): void {
    const ss = lodash.cloneDeep(this.saveFacetModel);
    ss.favorites = ss.favorites.filter((f) => f.name !== favorite.name).map((fav) => marshalFavorite(fav));

    this.facetPrefsHttpService.save(`facet-${this.config.app}-${this.facetOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveFacetSubject.next(true);
      },
      (err) => {
        this.popupService.showError();
      }
    );
  }

  doShowSettings(): void {
    this.select.emit(null);
    this.dialog.open(McitSettingsModalComponent, {
      dialogClass: 'modal-lg',
      disableClose: false,
      data: {
        facetOptions: this.facetOptions
      }
    });
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

  private addFavorites(favorites: IFavoriteFacetPref[]): void {
    const ss = this.saveFacetModel ? lodash.cloneDeep(this.saveFacetModel) : { favorites: [] };
    ss.favorites = lodash.uniqBy(lodash.concat([], favorites, ss.favorites), (e) => e.name);

    this.facetPrefsHttpService.save(`facet-${this.config.app}-${this.facetOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveFacetSubject.next(true);
      },
      (err) => {
        this.popupService.showError();
      }
    );
  }

  doExport(): void {
    this.urlHelperService.download(JSON.stringify(this.saveFacetModel.favorites), ' application/json', `export-facet-${this.facetOptions.save.id}.json`);
  }
}
