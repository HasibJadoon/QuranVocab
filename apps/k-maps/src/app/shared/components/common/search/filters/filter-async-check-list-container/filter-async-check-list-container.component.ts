import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FilterShowMode, IFilterAsyncCheckList } from '../../search-options';

@Component({
  selector: 'mcit-filter-async-check-list-search-container',
  templateUrl: './filter-async-check-list-container.component.html',
  styleUrls: ['./filter-async-check-list-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterAsyncCheckListContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterAsyncCheckListContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterAsyncCheckList;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  codes: string[];

  list$: Observable<{ id: string; name: string }[]>;
  list: { id: string; name: string }[];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor() {}

  ngOnInit(): void {
    this.list$ = this.filterConfig.asyncCheckList.values.pipe(tap((res) => (this.list = res)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;
    if (value) {
      if (this.filterConfig.asyncCheckList.result === 'string') {
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

  doChangeCode(name: string, event): void {
    this.codes = this.list
      .filter((o) => {
        if (o.name === name) {
          return event.target.checked;
        } else {
          return this.codes && this.codes.indexOf(o.name) !== -1;
        }
      })
      .map((o) => o.name);

    if (this.codes.length > 0) {
      if (this.filterConfig.asyncCheckList.result === 'string') {
        this.propagateChange(this.codes.join(','));
      } else {
        this.propagateChange(this.codes);
      }
    } else {
      this.propagateChange(null);
    }
  }
}
