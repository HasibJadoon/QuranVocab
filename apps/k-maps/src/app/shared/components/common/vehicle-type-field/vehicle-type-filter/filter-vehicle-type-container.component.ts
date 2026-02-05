import { Component, forwardRef, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { Subscription } from 'rxjs';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY, MCIT_FILTER_CUSTOM_MODE } from '../../search/filters/filter-custom-container/filter-custom-container.component';

export interface IVehicleTypeFilterModel {
  maker?: {
    code: string;
    name: string;
  };
  model?: {
    code: string;
    name: string;
  };
}

@Component({
  selector: 'mcit-filter-vehicle-type-search-container',
  templateUrl: './filter-vehicle-type-container.component.html',
  styleUrls: ['./filter-vehicle-type-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterVehicleTypeContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterVehicleTypeContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  groupForm: UntypedFormGroup;

  private default: any;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: any,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    @Inject(MCIT_FILTER_CUSTOM_MODE) public showMode: any,
    private formBuilder: UntypedFormBuilder
  ) {
    this.groupForm = this.formBuilder.group({
      _type: [null]
    });

    this.default = {
      _type: null
    };
  }

  ngOnInit(): void {
    const value = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, this.default);

    this.groupForm.setValue({
      _type: value
    });

    this.subscriptions.push(
      this.groupForm.get('_type').valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (next && next.maker) {
            this.propagateChange(next);
          } else {
            this.propagateChange(null);
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
    const res: any = {
      _type: v
    };

    this.groupForm.setValue(lodash.defaultsDeep({}, res, this.default));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}
}
