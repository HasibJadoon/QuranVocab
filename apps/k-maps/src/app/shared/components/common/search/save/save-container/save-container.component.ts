import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { McitCoreConfig } from '../../../helpers/provider.helper';
import { PER_PAGES } from '../../../helpers/pagination.helper';
import { IFavoriteSearchPref, ISearchPref, McitSearchPrefsHttpService } from '../../../services/search-prefs-http.service';
import { McitPopupService } from '../../../services/popup.service';
import * as lodash from 'lodash';
import { IFavoriteModel, IHistoryModel, marshalFavorite, unmarshalFavorite } from '../../search-model';
import { ISearchOptions } from '../../search-options';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitSettingsModalComponent } from '../settings-modal/settings-modal.component';
import { McitUrlHelperService } from '../../../services/url-helper.service';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

@Component({
  selector: 'mcit-save-search-container',
  templateUrl: './save-container.component.html',
  styleUrls: ['./save-container.component.scss']
})
export class McitSaveContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  searchOptions: ISearchOptions;
  @Input()
  showBack: boolean;

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  select = new EventEmitter();

  histories$: Observable<IHistoryModel[]>;
  favorites$: Observable<IFavoriteModel[]>;

  searchBox: string;
  querySubject = new Subject<string>();

  total: number;
  totalPages: number;
  per_page = 20;
  page = 1;

  saveSearchModel: ISearchPref;

  private resfreshSaveSearchSubject = new Subject<boolean>();
  private resfreshHistoriesSubject = new Subject<boolean>();
  private resfreshFavoritesSubject = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();

  private subscriptions: Subscription[] = [];

  constructor(
    private config: McitCoreConfig,
    private storage: McitStorage,
    private searchPrefsHttpService: McitSearchPrefsHttpService,
    private popupService: McitPopupService,
    private dialog: McitDialog,
    private urlHelperService: McitUrlHelperService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.resfreshSaveSearchSubject
        .asObservable()
        .pipe(
          filter((b) => b && this.searchOptions.save.favorite),
          switchMap(() =>
            this.searchPrefsHttpService.get(`search-${this.config.app}-${this.searchOptions.save.id}`, 'favorites').pipe(
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
          this.saveSearchModel = next;

          this.resfreshFavoritesSubject.next(true);
        })
    );

    this.histories$ = this.resfreshHistoriesSubject.asObservable().pipe(
      filter((b) => b),
      switchMap(
        () =>
          this.storage.get(`search-history-${this.searchOptions.save.id}`).pipe(
            map((res) => (res ? res : [])),
            catchError((err) => of([]))
          ) as Observable<IHistoryModel[]>
      )
    );

    this.favorites$ = this.resfreshFavoritesSubject.asObservable().pipe(
      filter((b) => b),
      switchMap(
        () =>
          of(this.saveSearchModel ? this.saveSearchModel.favorites : []).pipe(
            map((vs) => vs.filter((v) => new RegExp(lodash.escapeRegExp(this.searchBox), 'i').test(v.name))),
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
      this.resfreshSaveSearchSubject.next(true);
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
    const key = `search-history-${this.searchOptions.save.id}`;
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

  doClearSearchBox(): void {
    this.searchBox = '';
    this.querySubject.next('');
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doSelectFavorite(favorite: IFavoriteModel): void {
    this.select.emit({ favorite });
  }

  doDeleteFavorite(favorite: IFavoriteModel): void {
    const ss = lodash.cloneDeep(this.saveSearchModel);
    ss.favorites = ss.favorites.filter((f) => f.name !== favorite.name).map((fav) => marshalFavorite(fav));

    this.searchPrefsHttpService.save(`search-${this.config.app}-${this.searchOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveSearchSubject.next(true);
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
        searchOptions: this.searchOptions
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

  private addFavorites(favorites: IFavoriteSearchPref[]): void {
    const ss = this.saveSearchModel ? lodash.cloneDeep(this.saveSearchModel) : { favorites: [] };
    ss.favorites = lodash.uniqBy(lodash.concat([], favorites, ss.favorites), (e) => e.name);

    this.searchPrefsHttpService.save(`search-${this.config.app}-${this.searchOptions.save.id}`, ss).subscribe(
      (next) => {
        this.resfreshSaveSearchSubject.next(true);
      },
      (err) => {
        this.popupService.showError();
      }
    );
  }

  doExport(): void {
    this.urlHelperService.download(JSON.stringify(this.saveSearchModel.favorites), ' application/json', `export-search-${this.searchOptions.save.id}.json`);
  }
}
