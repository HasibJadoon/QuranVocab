import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterRadioList } from '../../search-options';

@Component({
  selector: 'mcit-filter-radio-list-search-container',
  templateUrl: './filter-radio-list-container.component.html',
  styleUrls: ['./filter-radio-list-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterRadioListContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterRadioListContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterRadioList;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  groupForm: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.groupForm = this.formBuilder.group({
      [this.key]: [null]
    });
    this.groupForm.setValue({
      [this.key]: this.initialFilter ? this.initialFilter : null
    });

    this.subscriptions.push(
      this.groupForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          this.propagateChange(next[this.key]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;

    this.groupForm.setValue({
      [this.key]: value ? value : d
    });
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}
}
