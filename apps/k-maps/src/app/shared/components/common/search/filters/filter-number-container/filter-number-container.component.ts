import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterConfig } from '../../search-options';
import * as lodash from 'lodash';
import { McitMenuDropdownService } from '../../../menu-dropdown/menu-dropdown.service';
import { INumberFilterModel } from '../../search-model';

const DEFAULT: INumberFilterModel = {
  min: {
    operator: 'gte',
    value: null
  },
  max: {
    operator: 'lte',
    value: null
  }
};

@Component({
  selector: 'mcit-filter-number-search-container',
  templateUrl: './filter-number-container.component.html',
  styleUrls: ['./filter-number-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterNumberContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterNumberContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterConfig;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  groupForm: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private menuDropdownService: McitMenuDropdownService) {
    this.groupForm = this.formBuilder.group({
      min: this.formBuilder.group({
        operator: [''],
        value: [null]
      }),
      max: this.formBuilder.group({
        operator: [''],
        value: [null]
      })
    });
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);

    this.groupForm.setValue(v);

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (lodash.isNil(next.min.value) && lodash.isNil(next.max.value)) {
            this.propagateChange(null);
          } else if (lodash.isNil(next.min.value)) {
            this.propagateChange(lodash.omit(next, ['min']));
          } else if (lodash.isNil(next.max.value)) {
            this.propagateChange(lodash.omit(next, ['max']));
          } else {
            this.propagateChange(next);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    if (value) {
      this.groupForm.setValue(lodash.defaultsDeep({}, value, DEFAULT));
    } else {
      this.groupForm.setValue(lodash.defaultsDeep({}, null, DEFAULT));
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doChangeMinOperator(button: any): void {
    this.menuDropdownService
      .chooseOptions(button, [
        { code: 'gte', nameKey: '>=', ellipse: false, noTranslate: true },
        { code: 'gt', nameKey: '>', ellipse: false, noTranslate: true }
      ])
      .subscribe((next) => {
        if (next) {
          this.groupForm.get('min.operator').setValue(next);
        }
      });
  }

  doChangeMaxOperator(button: any): void {
    this.menuDropdownService
      .chooseOptions(button, [
        { code: 'lte', nameKey: '<=', ellipse: false, noTranslate: true },
        { code: 'lt', nameKey: '<', ellipse: false, noTranslate: true }
      ])
      .subscribe((next) => {
        if (next) {
          this.groupForm.get('max.operator').setValue(next);
        }
      });
  }
}
