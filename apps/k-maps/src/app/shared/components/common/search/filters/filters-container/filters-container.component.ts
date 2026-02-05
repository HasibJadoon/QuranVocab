import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { IFiltersConfig } from '../../search-options';
import { McitSearchSettingsService } from '../../search-settings.service';
import { $FILTER_KIND$, FilterValueKind, ISettingsModel } from '../../search-model';

@Component({
  selector: 'mcit-filters-search-container',
  templateUrl: './filters-container.component.html',
  styleUrls: ['./filters-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFiltersContainerComponent),
      multi: true
    }
  ]
})
export class McitFiltersContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  id: string;
  @Input()
  filtersConfig: IFiltersConfig;
  @Input()
  initialFilters: { [key: string]: any };
  @Input()
  key: string;
  @Input()
  searchBox: string;

  groupForm: UntypedFormGroup;

  settings: ISettingsModel;

  showAllfilters = false;
  FilterValue = FilterValueKind;
  $FILTER_KIND$ = $FILTER_KIND$;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private searchSettingsService: McitSearchSettingsService) {}

  ngOnInit(): void {
    const group = Object.keys(this.filtersConfig).reduce((acc, v) => {
      const initialFilter = lodash.get(this.initialFilters, v, null);
      if (initialFilter === FilterValueKind.SET || initialFilter === FilterValueKind.UNSET) {
        acc[v + $FILTER_KIND$] = initialFilter;
      } else {
        acc[v + $FILTER_KIND$] = FilterValueKind.FILTERED;
      }
      acc[v] = [initialFilter];
      return acc;
    }, {});

    this.groupForm = this.formBuilder.group(group);

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          // this.propagateChange(next);
          this.propagateChange(
            Object.keys(next).reduce<any>((acc, key) => {
              if (!key.endsWith($FILTER_KIND$)) {
                const filterKind = next[key + $FILTER_KIND$];
                if (!filterKind || filterKind === FilterValueKind.FILTERED) {
                  let filter = next[key];
                  if (filter === FilterValueKind.SET || filter === FilterValueKind.UNSET) {
                    filter = null;
                  }
                  acc[key] = filter;
                } else {
                  acc[key] = next[key + $FILTER_KIND$];
                }
              }
              return acc;
            }, {})
          );
        }
      })
    );

    if (this.id) {
      this.subscriptions.push(
        this.searchSettingsService.settings$(this.id).subscribe((next) => {
          this.settings = next;
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any): void {
    const mergedFilters = Object.keys(this.filtersConfig).reduce((acc, v) => {
      acc[v] = null;
      acc[v + $FILTER_KIND$] = FilterValueKind.FILTERED;
      return acc;
    }, {});

    Object.keys(value).forEach((key) => {
      const val = value[key];
      if (val === FilterValueKind.SET || val === FilterValueKind.UNSET) {
        mergedFilters[key + $FILTER_KIND$] = val;
      }
      mergedFilters[key] = val;
    });
    this.groupForm.setValue(mergedFilters);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doToggleShowAllFilters(): void {
    this.showAllfilters = !this.showAllfilters;
  }

  doClearFilter(event: any, key: string): void {
    event.stopPropagation();

    this.groupForm.get(key).setValue(null);
  }

  resetValue(key: string, value: any): void {
    if (value === FilterValueKind.FILTERED) {
      this.groupForm.get(key).setValue(null);
    }
  }
}
