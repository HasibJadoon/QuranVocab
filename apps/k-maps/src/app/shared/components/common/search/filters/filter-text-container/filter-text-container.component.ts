import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterConfig, IFilterText } from '../../search-options';

@Component({
  selector: 'mcit-filter-text-search-container',
  templateUrl: './filter-text-container.component.html',
  styleUrls: ['./filter-text-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterTextContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterTextContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterConfig;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  text: string;
  checkbox?: string;
  filledOption?: boolean;
  emptyOption?: boolean;
  filledOptionChecked?: boolean;
  emptyOptionChecked?: boolean;
  checkboxChecked?: boolean;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor() {}

  isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return str;
    }
    return JSON.parse(str);
  }

  ngOnInit(): void {
    this.checkbox = (this.filterConfig as IFilterText).checkbox;
    this.filledOption = (this.filterConfig as IFilterText).filledOption;
    this.emptyOption = (this.filterConfig as IFilterText).emptyOption;
    if (this.checkbox) {
      this.initialFilter = this.isJsonString(this.initialFilter);
    }
    this.checkboxChecked = this.initialFilter ? this.initialFilter.checkboxChecked : null;
    if (this.checkbox) {
      this.filledOptionChecked = this.initialFilter ? this.initialFilter.text === 'filled' : null;
      this.emptyOptionChecked = this.initialFilter ? this.initialFilter.text === 'empty' : null;
    } else {
      this.filledOptionChecked = this.initialFilter ? this.initialFilter === 'filled' : null;
      this.emptyOptionChecked = this.initialFilter ? this.initialFilter === 'empty' : null;
    }
    if (this.filledOptionChecked || this.emptyOptionChecked) {
      this.text = null;
    } else {
      this.text = this.initialFilter ? (this.checkbox ? this.initialFilter.text : this.initialFilter) : null;
    }
  }

  doCheckboxChecked(): void {
    this.propagateChange({
      text: this.text,
      checkboxChecked: this.checkboxChecked
    });
  }

  doFilledOptionChecked(): void {
    this.text = null;
    this.emptyOptionChecked = false;
    this.filledOptionChecked = true;
    this.propagateChange('filled');
  }

  doEmptyOptionChecked(): void {
    this.text = null;
    this.emptyOptionChecked = true;
    this.filledOptionChecked = false;
    this.propagateChange('empty');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;
    if (value && value !== 'filled' && value !== 'empty') {
      this.text = this.isJsonString(value).checkboxChecked ? this.isJsonString(value).text : value;
    } else {
      this.text = d;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doChange(text: string): void {
    this.text = text;
    if (this.text) {
      this.emptyOptionChecked = false;
      this.filledOptionChecked = false;
    }
    this.propagateChange(this.text);
  }

  doClear(): void {
    this.doChange(null);
  }
}
