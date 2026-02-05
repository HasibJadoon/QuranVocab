import { Component, forwardRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ICategoriesConfig, IFacetOptions } from '../../facet-options';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { IFacetDataModel, IHistoryModel, ISettingsModel } from '../../facet-model';
import { McitSimpleAccordionComponent } from '../../../simple-accordion/simple-accordion.component';
import { McitSaveService } from '../../save/save.service';
import { switchMap } from 'rxjs/operators';
import { McitEditTextModalService } from '../../../edit-text-modal/edit-text-modal.service';
import { McitCoreConfig } from '../../../helpers/provider.helper';
import { McitFacetPrefsHttpService } from '../../../services/facet-prefs-http.service';
import { McitPopupService } from '../../../services/popup.service';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

const HISTORY_MAX = 5;

@Component({
  selector: 'mcit-categories-facet-container',
  templateUrl: './categories-container.component.html',
  styleUrls: ['./categories-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoriesContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoriesContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChildren(McitSimpleAccordionComponent)
  simpleAccordionComponents: QueryList<McitSimpleAccordionComponent>;

  @Input()
  loading = false;
  @Input()
  options: IFacetOptions;
  @Input()
  categoriesConfig: ICategoriesConfig;
  @Input()
  data: IFacetDataModel;
  @Input()
  settings: ISettingsModel;
  @Input()
  defaultValue: string;

  groupForm: UntypedFormGroup;

  searchBox = '';

  private currentHistory: IHistoryModel = null;
  currentFavorite = false;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private saveService: McitSaveService,
    private editTextModalService: McitEditTextModalService,
    private config: McitCoreConfig,
    private facetPrefsHttpService: McitFacetPrefsHttpService,
    private popupService: McitPopupService,
    private storage: McitStorage
  ) {}

  ngOnInit(): void {
    this.groupForm = this.formBuilder.group(
      Object.keys(this.categoriesConfig).reduce((acc, x) => {
        acc[x] = [null];
        return acc;
      }, {})
    );

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        this.currentFavorite = false;

        this.saveLastFacetHistory();

        if (this.propagateChange) {
          this.propagateChange(next);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = Object.keys(this.categoriesConfig).reduce((acc, v) => {
      acc[v] = null;
      return acc;
    }, {});

    this.groupForm.setValue(lodash.merge(d, value), {
      emitEvent: false
    });

    this.currentFavorite = false;
    this.currentHistory = null;
    this.saveLastFacetHistory();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doOpenAll(): void {
    this.simpleAccordionComponents.forEach((i) => i.doOpen());
  }

  doCloseAll(): void {
    this.simpleAccordionComponents.forEach((i) => i.doClose());
  }

  doClearAll(): void {
    this.groupForm.reset();
  }

  doClearCategory(event: any, key: string): void {
    event.stopPropagation();

    this.groupForm.get(key).setValue(null);
  }

  private isDefaultFacet(): boolean {
    const value = this.groupForm.value;

    if (!value) {
      return true;
    }

    const d = Object.keys(this.options.categories.categoriesConfig).reduce((acc, v) => {
      acc[v] = null;
      return acc;
    }, {});
    return lodash.isEqual(d, value);
  }

  private saveLastFacetHistory(): void {
    if (!this.options.save) {
      return;
    }

    if (this.isDefaultFacet()) {
      this.currentHistory = null;
      return;
    }

    if (!this.currentHistory) {
      const date = new Date();
      this.currentHistory = {
        id: `${this.options.save.id}-${date.getTime()}`,
        created_date: date,
        value: {
          categories: lodash.omitBy(this.groupForm.value, lodash.isNil)
        }
      };
    } else {
      this.currentHistory.value.categories = lodash.omitBy(this.groupForm.value, lodash.isNil);
    }

    const key = `facet-history-${this.options.save.id}`;
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

  doShowHistory(historyButton: any): void {
    this.saveService.showSave(historyButton, this.options, this.settings).subscribe((v) => {
      if (v) {
        if (v.history) {
          this.currentHistory = v.history;

          this.groupForm.patchValue(v.history.value.categories);
        } else if (v.favorite) {
          this.currentHistory = null;

          this.groupForm.patchValue(v.favorite.value.categories);
        }

        if (v.favorite) {
          this.currentFavorite = true;
        }
      }
    });
  }

  doSaveFavorite(): void {
    this.editTextModalService.editText('text', 'FACET_FIELD.SAVE_FAVORITE', '', 'text', true).subscribe((next) => {
      if (next) {
        const key = `facet-${this.config.app}-${this.options.save.id}`;

        this.facetPrefsHttpService
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
                  categories: this.groupForm.value
                },
                created_date: new Date()
              });
              return this.facetPrefsHttpService.save(key, ss);
            })
          )
          .subscribe(
            () => {
              this.popupService.showSuccess('FACET_FIELD.FAVORITE_SAVED', {
                messageParams: {
                  name: next.value
                }
              });

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
}
