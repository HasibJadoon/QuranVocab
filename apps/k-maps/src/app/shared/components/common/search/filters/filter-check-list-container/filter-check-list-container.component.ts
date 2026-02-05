import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterCheckList } from '../../search-options';

@Component({
  selector: 'mcit-filter-check-list-search-container',
  templateUrl: './filter-check-list-container.component.html',
  styleUrls: ['./filter-check-list-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterCheckListContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterCheckListContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterCheckList;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  codes: string[];
  tempDisabled: string[] = [];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;

    if (value) {
      if (this.filterConfig.checkList.result === 'string') {
        this.codes = value.split(',');
      } else {
        this.codes = value;
      }
    } else {
      this.codes = d;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doChangeCode(code: string, event, unSelectAll?: boolean): void {
    if (unSelectAll) {
      this.codes = [code];
      if (this.tempDisabled.length === 0) {
        this.filterConfig.checkList.values.forEach((o) => {
          if (o.code !== code) {
            this.tempDisabled.push(o.code);
          }
        });
      } else {
        this.tempDisabled = [];
      }
    } else {
      this.tempDisabled = [];
      this.codes = this.filterConfig.checkList.values
        .filter((o) => {
          if (o.code === code) {
            return event.target.checked;
          } else if (!o.unSelectAll) {
            return this.codes && this.codes.indexOf(o.code) !== -1;
          }
        })
        .map((o) => o.code);
    }

    if (this.codes.length > 0) {
      if (this.filterConfig.checkList.result === 'string') {
        this.propagateChange(this.codes.join(','));
      } else {
        this.propagateChange(this.codes);
      }
    } else {
      this.propagateChange(null);
    }
  }
}
