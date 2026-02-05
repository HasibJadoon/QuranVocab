import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { FilterShowMode, IFilterAsyncSelectList } from '../../search-options';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'mcit-filter-async-select-list-search-container',
  templateUrl: './filter-async-select-list-container.component.html',
  styleUrls: ['./filter-async-select-list-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterAsyncSelectListContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterAsyncSelectListContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterAsyncSelectList;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  groupForm: UntypedFormGroup;

  list$: Observable<{ id: string; name: string }[]>;
  list: { id: string; name: string }[];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      value: [null]
    });
  }

  ngOnInit(): void {
    this.list$ = this.filterConfig.asyncSelectList.values.pipe(tap((res) => (this.list = res)));

    const d = this.initialFilter ? this.initialFilter : null;
    this.groupForm.setValue({
      value: d ? d.id : null
    });

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          this.propagateChange(this.list.find((l) => l.id === next.value));
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    this.groupForm.setValue({
      value: value ? value.id : null
    });
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}
}
