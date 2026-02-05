import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { FilterShowMode, IFilterAutoComplete } from '../../search-options';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-filter-multi-autocomplete-search-container',
  templateUrl: './filter-multi-autocomplete-container.component.html',
  styleUrls: ['./filter-multi-autocomplete-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterMultiAutocompleteContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterMultiAutocompleteContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
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

  list: { id: string; name: string; description: string }[];
  selectList: { id: string; name: string; description: string; excluded?: boolean; empty?: boolean }[];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.groupForm = this.formBuilder.group({
      value: [null],
      excluded: false,
      empty: false
    });
  }

  ngOnInit(): void {
    this.selectList = this.initialFilter ? this.initialFilter : [];
    this.groupForm.get('excluded').setValue(this.selectList[0]?.excluded);
    this.groupForm.get('empty').setValue(this.initialFilter?.length === 0);

    this.subscriptions.push(
      this.groupForm
        .get('value')
        .valueChanges.pipe(
          debounceTime(100),
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
    const d = [];

    this.groupForm.get('value').setValue(null);

    this.selectList = value ? lodash.cloneDeep(value) : d;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doSelected(event): void {
    this.selectList.push(lodash.pick(event, ['id', 'name', 'description']));

    this.groupForm.get('value').setValue(null);
    this.list = null;

    this.propagateChange(this.selectList);
  }

  onExludeChange(event): void {
    this.selectList.forEach((select) => (select.excluded = this.groupForm.get('excluded').value));

    this.propagateChange(this.selectList);
  }

  onEmptyChange(event): void {
    this.selectList.forEach((select) => (select.empty = this.groupForm.get('empty').value));
    this.propagateChange(this.selectList);
  }

  doClear(): void {
    this.groupForm.get('value').setValue(null);
    this.list = null;
  }

  doRemove(index): void {
    this.selectList.splice(index, 1);
    if (this.selectList.length > 0) {
      this.propagateChange(this.selectList);
    } else {
      this.propagateChange(null);
    }
  }

  doClearList(): void {
    this.selectList = [];
    this.propagateChange(null);
  }
}
