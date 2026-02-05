import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterConfig } from '../../search-options';
import * as lodash from 'lodash';
import { IDateFilterModel } from '../../search-model';

const DEFAULT: IDateFilterModel = {
  mode: 'range',
  min: {
    value: null
  },
  max: {
    value: null
  }
};

@Component({
  selector: 'mcit-filter-reduced-date-search-container',
  templateUrl: './filter-reduced-date-container.component.html',
  styleUrls: ['./filter-reduced-date-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterReducedDateContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterReducedDateContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
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

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      mode: [''],
      min: this.formBuilder.group({
        value: [null]
      }),
      max: this.formBuilder.group({
        value: [null]
      })
    });
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);

    if (!lodash.isNil(lodash.get(v, 'min.value'))) {
      v.min.value = new Date(v.min.value);
    }
    if (!lodash.isNil(lodash.get(v, 'max.value'))) {
      v.max.value = new Date(v.max.value);
    }

    this.groupForm.setValue(v);

    this.subscriptions.push(
      this.groupForm.get('mode').valueChanges.subscribe((next) => {
        if (next === 'range') {
          this.groupForm.get('min.value').enable();
          this.groupForm.get('max.value').enable();
        } else {
          this.groupForm.get('min.value').setValue(null);
          this.groupForm.get('max.value').setValue(null);

          this.groupForm.get('min.value').disable();
          this.groupForm.get('max.value').disable();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (next.mode === 'range') {
            let min = lodash.get(next, 'min.value', null);
            let max = lodash.get(next, 'max.value', null);
            if (lodash.isNil(min) || lodash.isNil(max)) {
              this.propagateChange(null);
            } else {
              if (max < min) {
                [max, min] = [min, max];
              }
              next.max.value = this.convertDate(max);
              next.min.value = this.convertDate(min);
              if (max.getMonth() === min.getMonth() && max.getFullYear() === min.getFullYear()) {
                this.propagateChange(next);
              }
            }
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const v = value ? lodash.cloneDeep(value) : null;
    if (!lodash.isNil(lodash.get(v, 'min.value'))) {
      v.min.value = new Date(v.min.value);
    }
    if (!lodash.isNil(lodash.get(v, 'max.value'))) {
      v.max.value = new Date(v.max.value);
    }
    this.groupForm.setValue(lodash.defaultsDeep({}, v, DEFAULT));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  private convertDate(value): string {
    const date = new Date(value);
    const year = lodash.padStart(date.getFullYear().toString(), 4, '0');
    const month = lodash.padStart((date.getMonth() + 1).toString(), 2, '0');
    const day = lodash.padStart(date.getDate().toString(), 2, '0');
    return `${year}-${month}-${day}`;
  }
}
