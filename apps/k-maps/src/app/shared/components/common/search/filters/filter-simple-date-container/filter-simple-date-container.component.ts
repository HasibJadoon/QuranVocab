import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IFilterConfig } from '../../search-options';
import * as lodash from 'lodash';
import { ISimpleDateFilterModel } from '../../search-model';

const DEFAULT: ISimpleDateFilterModel = {
  date: {
    value: null
  }
};

@Component({
  selector: 'mcit-filter-simple-date-search-container',
  templateUrl: './filter-simple-date-container.component.html',
  styleUrls: ['./filter-simple-date-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterSimpleDateContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterSimpleDateContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterConfig;
  @Input()
  initialFilter: any;

  groupForm: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      date: this.formBuilder.group({
        value: [null]
      })
    });
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);

    if (!lodash.isNil(lodash.get(v, 'date.value'))) {
      v.date.value = new Date(v.date.value);
    }

    this.groupForm.setValue(v);

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          const date = lodash.get(next, 'date.value', null);
          if (lodash.isNil(date)) {
            this.propagateChange(null);
          } else {
            next.date.value = this.convertDate(date);
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
    const v = value ? lodash.cloneDeep(value) : null;
    if (!lodash.isNil(lodash.get(v, 'date.value'))) {
      v.date.value = new Date(v.date.value);
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
