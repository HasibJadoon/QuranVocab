import { Component, EventEmitter, forwardRef, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidatorFn, Validators } from '@angular/forms';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { McitPopupService } from '../services/popup.service';
import { compact, get, omit, pick } from 'lodash';
import { McitMeaningPipe } from '../common/pipes/meaning.pipe';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'mcit-object-search-field',
  templateUrl: './object-search-field.component.html',
  styleUrls: ['./object-search-field.component.scss'],
  providers: [
    McitMeaningPipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitObjectSearchFieldComponent),
      multi: true
    }
  ]
})
export class McitObjectSearchFieldComponent<T> implements OnInit, ControlValueAccessor {
  formGroup: UntypedFormGroup;
  dataSource: Observable<any>;
  loading = false;
  currentObject: any;

  /**
   * Required input.
   *
   * Will update the validator.
   */
  private _required = false;
  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.formGroup.controls['field'].setValidators(Validators.compose(compact([this._required ? Validators.required : null, ...(this.validators ?? [])])));
  }

  get required(): boolean {
    return this._required;
  }

  /**
   * Placeholder.
   *
   * Will not be translated.
   */
  @Input() placeholder: string;

  /**
   * Font Awesome icon.
   *
   * Specify a Font Awesome icon.
   * Default : file icon.
   */
  @Input() faIcon = 'fal fa-file';

  /**
   * Filter css style.
   *
   * Set to true to add filter style to the search field.
   * Will add a border and reduce the size.
   * Default : false.
   */
  @Input() filterStyle = false;

  /**
   * Autocomplete call.
   *
   * You must provide a LAMBDA (with 'search text' provided as an argument) returning an 'autocomplete' call that return
   * either Observable<any[]> or Observable<HttpResponse<any[]>> .
   *
   * @example
   * ".ts"
   * autocompleteCall = (searchValue: string): Observable<any> => {
   *   return this.myService.autocomplete(searchValue, 1 , 5, 'created_date');
   * }
   *
   * ".html"
   * [autocompleteCall] = "autocompleteCall"
   */
  @Input() autocomplete: (searchValue: string) => Observable<any[] | HttpResponse<any>>;

  /**
   * Attribute to display when item is selected.
   *
   * Handle object path like 'outer.inner' (use lodash get)
   * Default : 'name'.
   */
  @Input() displayedField = 'name';

  /**
   * List of attributes to display in complement with the displayed field.
   *
   * Handle object path like 'outer.inner' (use lodash get)
   */
  @Input() displayedSecondaryFields: string[] = [];

  /**
   * Minimum length of text typed before searching.
   *
   * Default : 3.
   */
  @Input() typeaheadMinLength = 3;

  /**
   * Mapping function called before propagating the selected item.
   *
   * Specify a LAMBDA that takes the selected item to modify it before propagating it.
   * The lambda can return directly an object or an Observable.
   *
   * @example
   * ".ts"
   * propagateMapping = (itemSelected: any): Observable<any> =>  {
   *   return this.myService.get(itemSelected._id);
   * }
   *
   * ".html"
   * [propagateMapping] = "propagateMapping"
   */
  @Input() propagateMapping: (itemSelected: any) => any | Promise<any | HttpResponse<any>>;

  /**
   * Mapping function called when entering 'writeValue' method.
   *
   * Specify a LAMBDA that takes the value being written to modify it.
   * The lambda can return directly an object or a Promise.
   *
   * @example
   * ".ts"
   * writeValueMapping = (value: any): Observable<any> =>  {
   *   return this.myService.get(value._id);
   * }
   *
   * ".html"
   * [writeValueMapping] = "writeValueMapping"
   */
  @Input() writeValueMapping: (value: any) => any | Promise<any | HttpResponse<any>>;

  /**
   * Object mapping when propagating object.
   *
   * By default, the item selected is propagated without change or after being mapped by the 'propagateMapping' lambda.
   * Specify one of the three attributes, if more is given the first in this order will be called and the others ignored :
   * pick, omit, flattenAttribute.
   * 'pick' option will pick a list of attribute from the object (lodash pick).
   * 'omit' option will omit a list of attribute from the object (lodash omit).
   * 'flattenAttribute' option will only return one attribute flattened.
   *
   *  @example
   *  [propagateMappingComplement] = "{ pick: ['_id', 'code', 'name'] }"
   *
   *  [propagateMappingComplement] = "{ omit: ['created_date'] }"
   *
   *  [propagateMappingComplement] = "{ flattenAttribute: 'code' }"
   */
  @Input() propagateMappingComplement: {
    pick?: string[];
    omit?: string[];
    flattenAttribute?: string;
  };

  /**
   * Validators list.
   *
   * @example
   * ".ts"
   * validateObject: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
   *   if (control.value && control.value > 5) {
   *     return {'errorName': true};
   *   }
   *   return null;
   * }
   *
   * ".html"
   * [validators]="[validateObject]"
   */
  @Input() validators: ValidatorFn[];

  /**
   * Error messages object.
   *
   * Use this to add error messages when using validators.
   * Given messages will be translated.
   *
   * @example
   * [errorMessages]="{
   *   errorName1: 'COMMON.ERROR_1',
   *   errorName2: 'COMMON.ERROR_2',
   * }"
   */
  @Input() errorMessages: { [key: string]: string };

  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();

  @Input() customTemplate: TemplateRef<any>;

  private propagateChange: (_: any) => void = () => undefined;

  constructor(private formBuilder: UntypedFormBuilder, private popupService: McitPopupService) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      field: [null, Validators.compose(compact([this._required ? Validators.required : null, ...(this.validators ?? [])]))]
    });

    this.dataSource = new Observable((observer: any) => {
      observer.next(this.formGroup.controls['field'].value);
    }).pipe(switchMap((searchValue: string) => this.getAutocompleteQuery(searchValue)));
  }

  /**
   * Return autocomplete query.
   * @param searchValue
   * @private
   */
  private getAutocompleteQuery(searchValue: string): Observable<any[]> {
    return this.autocomplete(searchValue).pipe(
      map((item) => (item instanceof HttpResponse ? item.body : item)),
      catchError((err, cause) => {
        this.popupService.showError();
        return EMPTY;
      })
    );
  }

  /**
   * Process error messages.
   */
  getErrorMessage(): string {
    const control = this.formGroup.controls['field'];
    if (control.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    }
    if (this.errorMessages) {
      const keyWithError = Object.keys(this.errorMessages).find((key) => control.hasError(key));
      return keyWithError ? this.errorMessages[keyWithError] : '';
    } else {
      return '';
    }
  }

  /**
   * Set loading status.
   * @param loading
   */
  doLoading(loading: boolean): void {
    this.loading = loading;
  }

  /**
   * Process selected item.
   */
  doSelected(event): void {
    const itemSelected = event.item;
    if (this.propagateMapping) {
      this.loading = true;
      const result = this.propagateMapping(itemSelected);
      Promise.resolve(result)
        .then((item) => {
          item = item instanceof HttpResponse ? item.body : item;
          this.loading = false;
          this.currentObject = item;
          const toPropagate = this.propagateMappingComplementMethod(item);
          this.propagateChange(toPropagate);
          this.valueChange.emit(toPropagate);
        })
        .catch((error) => {
          this.loading = false;
          this.popupService.showError();
        });
    } else {
      this.currentObject = itemSelected;
      const toPropagate = this.propagateMappingComplementMethod(itemSelected);
      this.propagateChange(toPropagate);
      this.valueChange.emit(toPropagate);
    }
  }

  private propagateMappingComplementMethod(object: any) {
    if (this.propagateMappingComplement) {
      if (this.propagateMappingComplement.pick) {
        return pick(object, this.propagateMappingComplement.pick);
      } else if (this.propagateMappingComplement.omit) {
        return omit(object, this.propagateMappingComplement.pick);
      } else if (this.propagateMappingComplement.flattenAttribute) {
        return object[this.propagateMappingComplement.flattenAttribute];
      }
    } else {
      return object;
    }
  }

  /**
   * Process clear action.
   */
  doClear(): void {
    this.formGroup.controls['field'].setValue(null);
    this.currentObject = null;
    this.propagateChange(null);
    this.valueChange.emit(null);
  }

  /**
   * Overridden writeValue.
   * @param value
   */
  writeValue(value: any) {
    if (value) {
      if (this.writeValueMapping) {
        this.loading = true;
        const result = this.writeValueMapping(value);
        Promise.resolve(result)
          .then((item) => {
            item = item instanceof HttpResponse ? item.body : item;
            this.loading = false;
            this.currentObject = item;
            this.formGroup.controls['field'].setValue(get(item, this.displayedField));
          })
          .catch((error) => {
            this.loading = false;
            this.popupService.showError();
          });
      } else {
        this.currentObject = value;
        this.formGroup.controls['field'].setValue(get(value, this.displayedField));
      }
    } else {
      this.currentObject = null;
      this.formGroup.controls['field'].setValue(null);
    }
  }

  /**
   * Overridden registerOnChange.
   * @param fn
   */
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  /**
   * Overridden registerOnTouched.
   * @param fn
   */
  registerOnTouched(fn: any): void {}

  /**
   * Overridden setDisabledState.
   * @param disabled
   */
  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.formGroup.controls['field'].disable();
    } else {
      this.formGroup.controls['field'].enable();
    }
  }
}
