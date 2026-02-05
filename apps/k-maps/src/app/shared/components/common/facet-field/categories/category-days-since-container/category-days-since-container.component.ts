import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ICategoryDaysSinceConfig, IFacetOptions } from '../../facet-options';
import { ICategoryLineModel } from '../../facet-model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'mcit-category-days-since-facet-container',
  templateUrl: './category-days-since-container.component.html',
  styleUrls: ['./category-days-since-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoryDaysSinceContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoryDaysSinceContainerComponent implements OnInit, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  options: IFacetOptions;
  @Input()
  categoryConfig: ICategoryDaysSinceConfig;
  @Input()
  data: ICategoryLineModel[];

  base: string;
  value: ICategoryDaysSinceConfig['daysSince']['boundaries'][number];

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit(): void {}

  writeValue(value: any) {
    if (value == null) {
      this.base = null;
      this.value = null;
      return;
    }

    this.base = value.base;
    this.value = this.categoryConfig.daysSince?.boundaries?.find((b) => (b.min != null ? b.min === value.gte : b.max === value.lt));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doBaseChanged(): void {
    this.value = null;

    this.emit();
  }

  doCheckChange(boundary: ICategoryDaysSinceConfig['daysSince']['boundaries'][number]): void {
    this.value = this.value?.value === boundary.value ? null : boundary;
    this.emit();
  }

  private emit(): void {
    this.propagateChange(this.base ? { base: this.base, ...(this.value ? { gte: this.value.min, lt: this.value.max } : {}) } : null);
  }
}
