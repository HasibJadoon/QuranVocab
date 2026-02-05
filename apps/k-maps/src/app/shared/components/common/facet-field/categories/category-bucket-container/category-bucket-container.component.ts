import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ICategoryBucketConfig, IFacetOptions } from '../../facet-options';
import { ICategoryLineModel } from '../../facet-model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'mcit-category-bucket-facet-container',
  templateUrl: './category-bucket-container.component.html',
  styleUrls: ['./category-bucket-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoryBucketContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoryBucketContainerComponent implements OnInit, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  options: IFacetOptions;
  @Input()
  categoryConfig: ICategoryBucketConfig;
  @Input()
  data: ICategoryLineModel[];
  @Input()
  defaultValue: string;

  value: ICategoryBucketConfig['bucket']['boundaries'][number];

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit(): void {}

  writeValue(value: any) {
    this.value = value != null ? this.categoryConfig.bucket?.boundaries?.find((b) => b.min === value.gte) : null;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doCheckChange(boundary: ICategoryBucketConfig['bucket']['boundaries'][number]): void {
    this.value = this.value?.value === boundary.value ? null : boundary;
    this.propagateChange(this.value ? { gte: boundary.min, lt: boundary.max } : null);
  }
}
