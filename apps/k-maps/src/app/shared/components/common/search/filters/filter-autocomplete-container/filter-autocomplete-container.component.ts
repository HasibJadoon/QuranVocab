import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { FilterShowMode, IFilterAutoComplete } from '../../search-options';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-filter-autocomplete-search-container',
  templateUrl: './filter-autocomplete-container.component.html',
  styleUrls: ['./filter-autocomplete-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterAutocompleteContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterAutocompleteContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterAutoComplete;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  groupForm: UntypedFormGroup;

  waiting = false;

  list: { id: string; name: string; description: string; icon: string }[];
  select: { id: string; name: string };

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      value: [null]
    });
  }

  ngOnInit(): void {
    this.select = this.initialFilter ? this.initialFilter : null;

    this.subscriptions.push(
      this.groupForm
        .get('value')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waiting = true)),
          switchMap((v) =>
            v
              ? this.filterConfig.autocomplete.search(v).pipe(
                  catchError((err, cause) => {
                    console.error(err);
                    return of(null);
                  })
                )
              : of(null)
          ),
          tap(() => (this.waiting = false))
        )
        .subscribe((next) => {
          this.list = next;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;

    this.groupForm.setValue({
      value: null
    });
    this.select = value ? lodash.cloneDeep(value) : d;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doSelected(event): void {
    this.select = event;

    this.groupForm.get('value').setValue(null);
    this.list = null;

    this.propagateChange(event);
  }

  doClear(): void {
    this.groupForm.get('value').setValue(null);
    this.list = null;
  }
}
