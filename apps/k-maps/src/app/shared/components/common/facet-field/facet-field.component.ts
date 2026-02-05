import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoryVisibility, ICategoriesModel, IFacetDataModel, IFacetModel, ISettingsModel } from './facet-model';
import { IFacetOptions } from './facet-options';
import * as lodash from 'lodash';
import { BreakpointObserver } from '@angular/cdk/layout';
import { McitCategoriesService } from './categories/categories.service';
import { catchError, concatMap, filter, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of, timer } from 'rxjs';
import { McitFacetSettingsService } from './facet-settings.service';
import { McitCoreConfig } from '../helpers/provider.helper';
import { McitFacetPrefsHttpService } from '../services/facet-prefs-http.service';
import { McitPopupService } from '../services/popup.service';
import { McitStorage } from '../storage/mcit-storage';

@Component({
  selector: 'mcit-facet-field',
  templateUrl: './facet-field.component.html',
  styleUrls: ['./facet-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFacetFieldComponent),
      multi: true
    }
  ]
})
export class McitFacetFieldComponent implements OnInit, ControlValueAccessor {
  @Input()
  loading = false;
  @Input()
  options: IFacetOptions;
  @Input()
  data: IFacetDataModel;
  @Input()
  defaultValue: string;

  categories: ICategoriesModel = {};

  isMobile$: Observable<boolean>;

  settings$: Observable<ISettingsModel>;

  private propagateChange: (_: any) => any;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private categoriesService: McitCategoriesService,
    private facetSettingsService: McitFacetSettingsService,
    private facetPrefsHttpService: McitFacetPrefsHttpService,
    private config: McitCoreConfig,
    private popupService: McitPopupService,
    private storage: McitStorage
  ) {}

  ngOnInit(): void {
    this.isMobile$ = of(this.options?.categories?.mode ?? 'auto').pipe(
      concatMap((mode) => (mode === 'auto' ? this.breakpointObserver.observe(`(min-width: ${this.options?.categories?.mobileWidth ?? 992}px)`).pipe(map((res) => !res.matches)) : of(mode === 'button')))
    );

    const settings = lodash.omitBy(
      {
        saveDisplayMode: lodash.get(this.options, 'save.showMode', null),
        categories: this.options.categories
          ? Object.keys(this.options.categories.categoriesConfig).reduce((acc, v) => {
              const f = this.options.categories.categoriesConfig[v];
              acc[v] = {
                visibility: f.defaultClose ? CategoryVisibility.CLOSE : CategoryVisibility.OPEN
              };
              return acc;
            }, {})
          : null,
        positions: this.options.categories ? Object.keys(this.options.categories.categoriesConfig) : []
      },
      lodash.isNil
    );

    if (this.options.save) {
      this.facetSettingsService.initSettings(this.options.save.id, settings);

      this.settings$ = this.facetSettingsService.settings$(this.options.save.id);
    } else {
      this.settings$ = of(settings);
    }
  }

  doUpdateChange(): void {
    this.propagateChange({
      categories: lodash.omitBy(this.categories, lodash.isEmpty)
    });
  }

  clearFacets(): void {
    this.categories = {};
    this.propagateChange({
      categories: this.categories
    });
  }

  writeValue(value: any) {
    if (value == null || !lodash.isObject(value)) {
      return;
    }
    const model = value as IFacetModel;

    // Si non initialisé et le model vide, on fait rien
    if (!model.categories || Object.keys(model.categories).length === 0) {
      return;
    }

    if (this.options.categories) {
      const d = Object.keys(this.options.categories.categoriesConfig).reduce((acc, v) => {
        acc[v] = null;
        return acc;
      }, {});

      this.categories = lodash.merge(d, model.categories);
    } else {
      this.categories = {};
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doShowCategories(): void {
    this.categoriesService
      .showCategories(this.options, this.options?.categories?.categoriesConfig, this.categories, this.data)
      .pipe(
        filter((res) => res != null),
        tap((res) => {
          this.categories = res;

          this.doUpdateChange();
        })
      )
      .subscribe();
  }

  saveFavorite(favoriteName: string) {
    const key = `facet-${this.config.app}-${this.options.save.id}`;

    return this.facetPrefsHttpService.get(key, 'favorites').pipe(
      switchMap((ss) => {
        if (!ss) {
          ss = {
            favorites: []
          };
        }

        ss.favorites = ss.favorites?.filter((f) => f.name !== favoriteName) ?? [];

        ss.favorites.push({
          name: favoriteName,
          value: {
            categories: this.categories
          },
          created_date: new Date()
        });
        return this.facetPrefsHttpService.save(key, ss);
      })
    );
  }

  refreshFavorite() {
    timer(0)
      .pipe(
        concatMap((r) =>
          this.storage.get(`${this.options.save.id}-current-favorite`).pipe(
            switchMap((currentFavoriteName) =>
              currentFavoriteName && currentFavoriteName != ''
                ? this.facetPrefsHttpService.get(`facet-${this.config.app}-${this.options.save.id}`, 'favorites').pipe(
                    catchError((err) => {
                      this.popupService.showError();
                      return of(null);
                    }),
                    map((results) => lodash.find(results?.favorites, (f) => f.name === currentFavoriteName)?.value)
                  )
                : of(null)
            )
          )
        )
      )
      .subscribe((next) => {
        if (next) {
          this.categories = next.categories;
          this.doUpdateChange();
        }
      });
  }
}
