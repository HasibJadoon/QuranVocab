import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ICategoryStandardConfig, IFacetOptions } from '../../facet-options';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FacetModel, ICategoryLineModel } from '../../facet-model';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-category-standard-facet-container',
  templateUrl: './category-standard-container.component.html',
  styleUrls: ['./category-standard-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoryStandardContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoryStandardContainerComponent implements OnInit, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  options: IFacetOptions;
  @Input()
  categoryConfig: ICategoryStandardConfig;
  @Input()
  data: ICategoryLineModel[];

  values: FacetModel[] = null;

  search = '';
  maxLines = 5;

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit(): void {
    this.maxLines = this.categoryConfig?.standard?.maxLines ?? 5;
  }

  writeValue(value: any) {
    if (!lodash.isArray(value)) {
      this.values = value != null ? [value] : null;
    } else {
      this.values = value.length > 0 ? value : null;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doCheckChange(_id: string): void {
    const equal = this.categoryConfig.isSelected != null ? this.categoryConfig.isSelected : lodash.isEqual;

    if (this.categoryConfig.selection !== 'multi') {
      this.values = this.values?.some((v) => equal(v, _id)) ? null : [_id];
    } else {
      if (this.values?.some((v) => equal(v, _id))) {
        if (this.values.length === 1) {
          this.values = null;
        } else {
          this.values = this.values.filter((v) => !equal(v, _id));
        }
      } else {
        this.values = [...(this.values ?? []), _id];
      }
    }

    this.propagateChange(this.categoryConfig.selection === 'multi' ? this.values : lodash.head(this.values));
  }

  doShowMore(lines: ICategoryLineModel[]): void {
    const ml = this.categoryConfig.standard?.maxLines ?? 5;
    this.maxLines = this.maxLines >= lines.length ? ml : this.maxLines + ml;
  }

  doHide(): void {
    this.maxLines = this.categoryConfig.standard?.maxLines ?? 5;
  }
}
