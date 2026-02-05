import { AfterContentInit, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, switchMap, take } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitFiltersService } from './filters/filters.service';
import { McitSaveService } from './save/save.service';
import { McitEditTextModalService } from '../edit-text-modal/edit-text-modal.service';
import { McitSearchPrefsHttpService } from '../services/search-prefs-http.service';
import { McitCoreConfig } from '../helpers/provider.helper';
import { McitPopupService } from '../services/popup.service';
import { IFiltersModel, IHistoryModel, ISearchModel, ISearchTagModel, ISettingsModel, marshalFavorite } from './search-model';
import { FilterType, FilterVisibility, ISearchOptions } from './search-options';
import { McitSearchSettingsService } from './search-settings.service';
import { McitListSearchService } from './list-search/list-search.service';
import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import { TagModel } from '@lib-shared/ngx-chips/core/tag-model';

const DEFAULT_OPTIONS: ISearchOptions = {
  save: null,
  filters: null,
  size: 'normal',
  condensed: false,
  showInfoText: true,
  infoTextKey: null,
  forceBorder: false,
  enableListSearch: false
};

const HISTORY_MAX = 5;

@Component({
  selector: 'mcit-search-field',
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitSearchFieldComponent),
      multi: true
    }
  ]
})
export class McitSearchFieldComponent implements OnInit, AfterContentInit, OnDestroy, ControlValueAccessor {
  @Input()
  loading = false;
  @Input()
  options: ISearchOptions = DEFAULT_OPTIONS;
  @Output()
  clearEvent = new EventEmitter<void>();
  @Output()
  saveFavorite = new EventEmitter<string>();

  availableTags: Array<ISearchTagModel>;

  searchBox: string;
  searchTags: Array<ISearchTagModel>;

  querySubject = new Subject<string | { searchBox: string; searchTags: Array<ISearchTagModel> }>();
  filters: IFiltersModel = {};
  sort: string;

  settings: ISettingsModel;

  showAllfilters = false;

  private currentHistory: IHistoryModel = null;
  currentFavorite = false;
  private currentFavoriteName: string = null;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  private initialized = false;
  private writeFilters = false;

  isMobile = false;

  constructor(
    private config: McitCoreConfig,
    private filtersService: McitFiltersService,
    private saveService: McitSaveService,
    private listSearchService: McitListSearchService,
    private storage: McitStorage,
    private editTextModalService: McitEditTextModalService,
    private searchPrefsHttpService: McitSearchPrefsHttpService,
    private popupService: McitPopupService,
    private searchSettingsService: McitSearchSettingsService,
    private menuDropdownService: McitMenuDropdownService,
    private translateService: TranslateService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.searchBox = '';

    this.subscriptions.push(
      this.querySubject
        .asObservable()
        .pipe(debounceTime(300))
        .subscribe(() => {
          this.updateChange();
        })
    );

    const settings = lodash.omitBy(
      {
        filtersDisplayMode: lodash.get(this.options, 'filters.showMode', null),
        saveDisplayMode: lodash.get(this.options, 'save.showMode', null),
        filters: this.options.filters
          ? Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
              const f = this.options.filters.filtersConfig[v];
              acc[v] = {
                visibility: f.visibility ? f.visibility : FilterVisibility.VISIBLE,
                defaultValue: f.defaultValue ? f.defaultValue : null
              };
              return acc;
            }, {})
          : null
      },
      lodash.isNil
    );

    if (this.options.save) {
      this.searchSettingsService.initSettings(this.options.save.id, settings);

      this.subscriptions.push(
        this.searchSettingsService.settings$(this.options.save.id).subscribe((next) => {
          this.settings = next;
        })
      );
    } else {
      this.settings = settings;
    }
    if (this.options.tagList) {
      this.availableTags = this.translateTags(this.options.tagList as Array<ISearchTagModel>);
      this.subscriptions.push(
        this.translateService.onLangChange.subscribe(() => {
          this.availableTags = this.translateTags(this.options.tagList as Array<ISearchTagModel>);
          this.searchTags = this.translateTags(this.searchTags);
        })
      );
    }
    this.subscriptions.push(this.breakpointObserver.observe('(max-width: 767px)').subscribe((match) => (this.isMobile = match.matches)));
  }

  ngAfterContentInit(): void {
    if (this.options.save) {
      this.searchSettingsService
        .settings$(this.options.save.id)
        .pipe(take(1))
        .subscribe((next) => {
          this.initialized = true;

          // Si pas reçu d'autres filtres par le write
          if (!this.writeFilters) {
            this.filters =
              this.options.filters && this.options.filters.filtersConfig
                ? Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
                    if (next.filters[v]) {
                      acc[v] = next.filters[v].defaultValue;
                      return acc;
                    }
                  }, {})
                : null;

            // On force le rafraichir seulement si il y a des filtres dans les default
            if (Object.keys(lodash.omitBy(this.filters, lodash.isNil)).length > 0) {
              this.updateChange();
            }
          }
        });
    } else {
      this.initialized = true;

      this.filters =
        this.options.filters && this.options.filters.filtersConfig
          ? Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
              acc[v] = !lodash.isNil(this.options.filters.filtersConfig[v].defaultValue) ? this.options.filters.filtersConfig[v].defaultValue : null;
              return acc;
            }, {})
          : null;

      // On force le rafraichir seulement si il y a des filtres dans les default
      if (Object.keys(lodash.omitBy(this.filters, lodash.isNil)).length > 0) {
        this.updateChange();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private updateChange(withFavorite?: boolean): void {
    this.currentFavorite = false;

    this.saveLastSearchHistory();

    this.propagateChange({
      text: this.searchBox,
      tags: this.options.tagList ? this.searchTags ?? [] : undefined,
      filters: this.filters,
      sort: this.sort,
      currentFavoriteName: withFavorite ? this.currentFavoriteName : undefined
    });
  }

  private isDefaultFilters(): boolean {
    if (!this.filters) {
      return true;
    }

    const d = Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
      acc[v] = null;
      return acc;
    }, {});
    return lodash.isEqual(d, this.filters);
  }

  private saveLastSearchHistory(): void {
    if (!this.options.save) {
      return;
    }

    if (this.filters?.comment?.checkboxChecked != null) {
      this.filters.comment = this.filters.comment.checkboxChecked ? JSON.stringify(this.filters.comment) : this.filters.comment.text;
    }

    if (!this.searchBox && this.isDefaultFilters()) {
      this.currentHistory = null;
      return;
    }

    if (!this.currentHistory) {
      const date = new Date();
      this.currentHistory = {
        id: `${this.options.save.id}-${date.getTime()}`,
        created_date: date,
        value: {
          text: this.searchBox,
          filters: lodash.omitBy(this.filters, lodash.isNil),
          sort: this.sort
        }
      };
    } else {
      this.currentHistory.value.text = this.searchBox;
      this.currentHistory.value.filters = lodash.omitBy(this.filters, lodash.isNil);
      this.currentHistory.value.sort = this.sort;
    }

    const key = `search-history-${this.options.save.id}`;
    this.storage
      .get(key)
      .pipe(
        switchMap((ls) => {
          const list = ls ? ls.filter((l) => l.id !== this.currentHistory.id && !lodash.isEqual(l.value, this.currentHistory.value)) : [];
          const res = [this.currentHistory].concat(list).slice(0, HISTORY_MAX);
          return this.storage.set(key, res);
        })
      )
      .subscribe();
  }

  writeValue(value: any) {
    if (value == null || !lodash.isObject(value)) {
      return;
    }
    const model = value as ISearchModel;

    // Si non initialisé et le model vide, on fait rien
    if (!this.initialized && !model.text && !model.tags?.length && (!model.filters || Object.keys(model.filters).length === 0)) {
      return;
    }

    // On a reçu des filtres par le write
    this.writeFilters = true;

    this.searchBox = model.text;
    this.searchTags = this.translateTags(model.tags);

    if (this.options.filters) {
      const d = Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
        acc[v] = null;
        return acc;
      }, {});

      this.filters = lodash.merge(d, model.filters);
    } else {
      this.filters = null;
    }

    if (model.sort) {
      this.sort = model.sort;
    }

    this.currentFavorite = false;
    this.currentHistory = null;
    this.saveLastSearchHistory();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doSaveFavorite(): void {
    this.editTextModalService.editText('text', 'SEARCH_FIELD.SAVE_FAVORITE', '', 'text', true).subscribe((next) => {
      if (next) {
        const key = `search-${this.config.app}-${this.options.save.id}`;

        this.searchPrefsHttpService
          .get(key, 'favorites')
          .pipe(
            switchMap((ss) => {
              if (!ss) {
                ss = {
                  favorites: []
                };
              }

              ss.favorites = ss.favorites?.filter((f) => f.name !== next.value) ?? [];

              ss.favorites.push({
                name: next.value,
                value: {
                  text: this.searchBox,
                  tags: this.searchTags?.map((searchTag) => marshalFavorite(lodash.omit(searchTag, 'display'))),
                  filters: this.filters,
                  sort: this.sort
                },
                created_date: new Date()
              });
              this.currentFavoriteName = next.value;
              return this.searchPrefsHttpService.save(key, ss);
            })
          )
          .subscribe(
            () => {
              this.popupService.showSuccess('SEARCH_FIELD.FAVORITE_SAVED', {
                messageParams: {
                  name: next.value
                }
              });
              this.saveFavorite.emit(next.value);
              this.currentFavorite = true;
            },
            (err) => {
              console.error(err);
              this.popupService.showError();
            }
          );
      }
    });
  }

  doClear(): void {
    this.searchBox = '';
    // Only clear search box
    // this.searchTags = [];
    if (this.options.filters?.resetOnClear ?? true) {
      this.filters =
        this.options.filters && this.options.filters.filtersConfig
          ? Object.keys(this.options.filters.filtersConfig).reduce((acc, v) => {
              acc[v] = lodash.get(this.settings.filters, `${v}.defaultValue`, null);
              return acc;
            }, {})
          : null;
    }

    this.updateChange();

    this.clearEvent.emit();
  }

  /**
   * Efface un filtre
   * @param id la clef du filtre
   */
  doClearFilter(id: string): void {
    this.filters = Object.assign({}, this.filters, { [id]: null });

    this.updateChange();
  }

  /**
   * Change un filtre
   */
  doShowFilters(filtersButton: any): void {
    this.filtersService.showFilters(filtersButton, this.options, this.searchBox, this.filters, this.settings).subscribe((v) => {
      if (v) {
        this.filters = v;

        this.updateChange();
      }
    });
  }

  /**
   * Affiche l'historique
   */
  doShowHistory(historyButton: any): void {
    this.saveService.showSave(historyButton, this.options, this.settings).subscribe((v) => {
      if (v) {
        if (v.history) {
          this.currentHistory = v.history;
          this.searchBox = v.history.value.text;
          this.searchTags = this.translateTags(v.history.value.tags);
          this.filters = v.history.value.filters;
        } else if (v.favorite) {
          this.currentHistory = null;
          this.currentFavoriteName = v.favorite.name;
          this.searchBox = v.favorite.value.text;
          this.searchTags = this.translateTags(v.favorite.value.tags);
          this.filters = v.favorite.value.filters;
          this.sort = v.favorite?.value?.sort;
        }

        this.updateChange(!lodash.isNil(v.favorite));

        if (v.favorite) {
          this.currentFavorite = true;
        }
      }
    });
  }

  /**
   * Affiche la text area pour une recherche mutiple
   */
  doShowTextArea(listButton: any): void {
    this.listSearchService.showList(listButton, this.options, this.searchBox).subscribe((t) => {
      if (t?.text != null && !lodash.isEqual(t.text, this.searchBox)) {
        this.searchBox = t.text;
        this.updateChange();
      }
    });
  }

  doShowFilter(filterButton: any, key: string): void {
    this.filtersService.showFilter(filterButton, this.options, this.filters, key).subscribe((v) => {
      if (v) {
        this.filters = v;

        this.updateChange();
      }
    });
  }

  doToggleShowAllFilters(): void {
    this.showAllfilters = !this.showAllfilters;
  }

  /**
   * Affiche le menu general
   */
  doShowMenu(menusButton: any): void {
    const options = [];
    if (this.options?.filters?.filtersConfig && this.settings?.filtersDisplayMode && this.settings.filtersDisplayMode !== 'inline') {
      const no_filter_fct = (f) => {
        if (!f) {
          return true;
        }
        const keys = Object.keys(f);
        if (keys.length === 0) {
          return true;
        }
        const res = keys.find((k) => !lodash.isNil(f[k]));
        return !res;
      };

      options.push({
        code: 'filter',
        nameKey: 'SEARCH_FIELD.FILTERS.TITLE',
        icon: no_filter_fct(this.filters) ? 'far fa-fw fa-filter' : 'fas fa-fw fa-filter',
        ellipse: false
      });
    }
    if (this.options && this.options.save && this.options.save.favorite) {
      options.push({
        code: 'favorite',
        nameKey: 'SEARCH_FIELD.SAVE.FAVORITES',
        icon: this.currentFavorite ? 'fas fa-star' : 'far fa-star',
        ellipse: false
      });
    }
    options.push({ code: 'clear', nameKey: 'COMMON.CLEAR', icon: 'far fa-times', ellipse: false });

    this.menuDropdownService.chooseOptions(menusButton, options).subscribe((next) => {
      if (next) {
        switch (next) {
          case 'filter':
            this.doShowFilters(menusButton);
            break;
          case 'favorite':
            this.doSaveFavorite();
            break;
          case 'clear':
            this.doClear();
            break;
        }
      }
    });
  }

  translateTags(tags: Array<ISearchTagModel>): Array<ISearchTagModel> {
    return tags?.map((tag) => {
      const translationKey = tag.nameKey ? tag.nameKey : tag.secondaries?.find((secondary) => !lodash.isNil(secondary.nameKey))?.nameKey;
      const translatedTag: ISearchTagModel = {
        ...lodash.omit(tag, 'display'),
        display: translationKey ? this.translateService.instant(translationKey) : undefined
      };
      if (tag.secondaries) {
        translatedTag.secondaries = this.translateTags(tag.secondaries);
      }
      return translatedTag;
    });
  }

  fireSearch(): void {
    if (this.options.tagList) {
      this.querySubject.next({ searchBox: this.searchBox, searchTags: this.searchTags });
    } else {
      this.querySubject.next(this.searchBox);
    }
  }

  resolveTag(tagModel: TagModel): Observable<TagModel> {
    let resolvedTag: TagModel;
    if (lodash.isString(tagModel)) {
      const resolvedTags = this.availableTags.filter((tag) => tag.value.toString().toUpperCase().includes(tagModel.toUpperCase()) || tag.display.toString().toUpperCase().includes(tagModel.toUpperCase()));
      resolvedTag = resolvedTags[0];
    } else {
      resolvedTag = tagModel;
    }
    let mandatorySecondaries;
    if (resolvedTag.nameKey) {
      mandatorySecondaries = [];
    } else {
      // The tag value relies on the first translatable secondary tag in that case. Force its display.
      mandatorySecondaries = [resolvedTag.secondaries.find((s) => s.nameKey)];
    }
    return of({
      ...lodash.omit(resolvedTag, 'secondaries'),
      secondaries: mandatorySecondaries
    });
  }

  editSecondaryTags(button: Element, tag: ISearchTagModel) {
    if (tag.secondaries && this.hasEditableSecondaries(tag)) {
      const optionsTag = this.options.tagList.find((t) => t.value === tag.value && lodash.isEqual(t.restrictions, tag.restrictions));
      if (optionsTag) {
        this.filtersService
          .showFilter(
            button,
            {
              filters: {
                filtersConfig: {
                  axis: {
                    type: FilterType.CHECK_LIST,
                    nameKey: tag.nameKey,
                    checkList: {
                      values: optionsTag.secondaries
                        .filter((s) => s.nameKey)
                        .map((s) => ({
                          code: s.value,
                          nameKey: s.nameKey
                        })),
                      result: 'array'
                    }
                  }
                }
              }
            },
            {
              axis: tag.secondaries.map((s) => s.value)
            },
            'axis'
          )
          .subscribe((result) => {
            if (result) {
              if (result?.axis) {
                tag.secondaries = optionsTag.secondaries.filter((s) => result.axis.indexOf(s.value) >= 0);
              } else {
                tag.secondaries = [];
              }
              this.fireSearch();
            }
          });
      }
    }
  }

  hasEditableSecondaries(tag: ISearchTagModel): boolean {
    return (this.options.tagList.find((t) => t.value === tag.value && lodash.isEqual(t.restrictions, tag.restrictions))?.secondaries?.filter((s) => s.nameKey)?.length ?? 0) > (tag.nameKey ? 0 : 1);
  }

  refreshTags(): void {
    if (this.options.tagList) {
      this.availableTags = this.translateTags(this.options.tagList as Array<ISearchTagModel>);
    }
  }
}
