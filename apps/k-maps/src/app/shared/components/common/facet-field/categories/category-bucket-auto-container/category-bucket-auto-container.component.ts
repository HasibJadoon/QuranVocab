import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ICategoryBucketAutoConfig, IFacetOptions } from '../../facet-options';
import { ICategoryLineModel } from '../../facet-model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'mcit-category-bucket-auto-facet-container',
  templateUrl: './category-bucket-auto-container.component.html',
  styleUrls: ['./category-bucket-auto-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoryBucketAutoContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoryBucketAutoContainerComponent implements OnInit, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  options: IFacetOptions;
  @Input()
  categoryConfig: ICategoryBucketAutoConfig;
  @Input()
  data: ICategoryLineModel[];

  value: any;

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit(): void {}

  writeValue(value: any) {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doSet(_id: any, isLast: boolean): void {
    if (isLast) {
      this.value = { gte: _id.min, lte: _id.max };
      this.propagateChange({ gte: _id.min, lte: _id.max });
    } else {
      this.value = { gte: _id.min, lt: _id.max };
      this.propagateChange({ gte: _id.min, lt: _id.max });
    }
  }

  doClear(): void {
    this.value = null;
    this.propagateChange(null);
  }
}
