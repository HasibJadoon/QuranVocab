import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterConfig, IFilterDate } from '../../search-options';
import * as lodash from 'lodash';
import { IDateFilterModel } from '../../search-model';

const DEFAULT: IDateFilterModel = {
  mode: 'range',
  min: {
    value: null,
    time: null
  },
  max: {
    value: null,
    time: null
  }
};

@Component({
  selector: 'mcit-filter-date-search-container',
  templateUrl: './filter-date-container.component.html',
  styleUrls: ['./filter-date-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterDateContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterDateContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterConfig;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  groupForm: UntypedFormGroup;
  hideEmpty?: boolean;

  times = [];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      mode: [''],
      min: this.formBuilder.group({
        value: [null],
        time: ['', [Validators.pattern(/^[\d]{2}:[\d]{2}$/)]]
      }),
      max: this.formBuilder.group({
        value: [null],
        time: ['', [Validators.pattern(/^[\d]{2}:[\d]{2}$/)]]
      })
    });
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        this.times.push(`${lodash.padStart(i.toString(), 2, '0')}:${lodash.padStart(j.toString(), 2, '0')}`);
      }
    }
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);
    this.hideEmpty = lodash.get(this.filterConfig, 'hideEmpty');

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

          this.groupForm.get('min.time').setValue(null);
          this.groupForm.get('max.time').setValue(null);

          this.groupForm.get('min.time').disable();
          this.groupForm.get('max.time').disable();
        } else if (next === 'rangeWithTime') {
          this.groupForm.get('min.value').enable();
          this.groupForm.get('max.value').enable();
          this.groupForm.get('min.time').enable();
          this.groupForm.get('max.time').enable();
          this.groupForm.get('min.time').setValue('00:00');
          this.groupForm.get('max.time').setValue('23:30');
        } else {
          this.groupForm.get('min.value').setValue(null);
          this.groupForm.get('max.value').setValue(null);
          this.groupForm.get('min.time').setValue(null);
          this.groupForm.get('max.time').setValue(null);

          this.groupForm.get('min.value').disable();
          this.groupForm.get('max.value').disable();
          this.groupForm.get('min.time').disable();
          this.groupForm.get('max.time').disable();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (next.mode === 'range' || next.mode === 'rangeWithTime') {
            const min = lodash.get(next, 'min.value', null);
            const max = lodash.get(next, 'max.value', null);
            const minTime = lodash.get(next, 'min.time', null);
            const maxTime = lodash.get(next, 'max.time', null);
            if (lodash.isNil(min) && lodash.isNil(max)) {
              this.propagateChange(null);
            } else if (lodash.isNil(min)) {
              next.max.value = this.convertDate(max, maxTime);
              this.propagateChange(lodash.omit(next, ['min']));
            } else if (lodash.isNil(max)) {
              next.min.value = this.convertDate(min, minTime);
              this.propagateChange(lodash.omit(next, ['max']));
            } else {
              next.max.value = this.convertDate(max, maxTime);
              next.min.value = this.convertDate(min, minTime);
              this.propagateChange(lodash.omit(next, ['min.time', 'max.time']));
            }
          } else {
            this.propagateChange({
              mode: next.mode
            });
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
      if (!lodash.isNil(v.min.value.getHours())) {
        v.min.time = this.transformTime(v.min.value);
      }
    }
    if (!lodash.isNil(lodash.get(v, 'max.value'))) {
      v.max.value = new Date(v.max.value);
      if (!lodash.isNil(v.max.value.getHours())) {
        v.max.time = this.transformTime(v.max.value);
      }
    }
    this.groupForm.setValue(lodash.defaultsDeep({}, v, DEFAULT));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  private transformTime(value: Date) {
    if (!value) {
      return null;
    }
    let hours = value.getHours().toString();
    let minutes = value.getMinutes().toString();
    hours = hours.length === 1 ? '0' + hours : hours;
    minutes = minutes.length === 1 ? '0' + minutes : minutes;
    return `${hours}:${minutes}`;
  }

  private convertDate(value, time?): string {
    const date = new Date(value);
    const year = lodash.padStart(date.getFullYear().toString(), 4, '0');
    const month = lodash.padStart((date.getMonth() + 1).toString(), 2, '0');
    const day = lodash.padStart(date.getDate().toString(), 2, '0');
    return time ? `${year}-${month}-${day}T${time}` : `${year}-${month}-${day}`;
  }

  doClearTime(parentControlName: string): void {
    this.groupForm.get(parentControlName).get('time').reset();
  }
}
