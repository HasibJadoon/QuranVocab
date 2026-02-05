import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterConfig } from '../../search-options';
import * as lodash from 'lodash';
import { ISimpleNumberFilterModel } from '../../search-model';

const DEFAULT: ISimpleNumberFilterModel = {
  value: null
};

@Component({
  selector: 'mcit-filter-simple-number-search-container',
  templateUrl: './filter-simple-number-container.component.html',
  styleUrls: ['./filter-simple-number-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterSimpleNumberContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterSimpleNumberContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
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
      value: [null]
    });
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);

    this.groupForm.setValue(v);

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (lodash.isNil(next.value)) {
            this.propagateChange(null);
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
}
