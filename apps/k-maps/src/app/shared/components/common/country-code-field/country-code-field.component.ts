import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { McitMeaningPipe } from '../common/pipes/meaning.pipe';
import { McitCountriesHttpService } from '../services/countries-http.service';
import { McitPopupService } from '../services/popup.service';

@Component({
  selector: 'mcit-country-code-field',
  templateUrl: './country-code-field.component.html',
  providers: [
    McitMeaningPipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCountryCodeFieldComponent),
      multi: true
    }
  ]
})
export class McitCountryCodeFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() placeholder: string;
  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;
    this.countryFieldForm.get('country').setValidators(Validators.compose(lodash.compact([this.validateCountry(), _required ? Validators.required : Validators.pattern('')])));
  }

  get required(): boolean {
    return this._required;
  }

  @Output() countryEvent = new EventEmitter<any>();

  countryFieldForm: UntypedFormGroup;
  countryDataSource: Observable<any>;
  countryLoading = false;

  private country: any;
  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private popupService: McitPopupService, private countriesHttpService: McitCountriesHttpService, private meaningPipe: McitMeaningPipe) {
    this.countryFieldForm = this.formBuilder.group({
      country: ['', Validators.compose(lodash.compact([this.validateCountry(), this.required ? Validators.required : Validators.pattern('')]))],
      country_code: [['', this.required ? Validators.required : Validators.pattern('')]]
    });
  }

  ngOnInit(): void {
    this.countryFieldForm = this.formBuilder.group({
      country: ['', Validators.compose(lodash.compact([this.validateCountry(), this.required ? Validators.required : Validators.pattern('')]))],
      country_code: ['', [this.required ? Validators.required : Validators.pattern('')]]
    });

    this.countryDataSource = new Observable((observer: any) => {
      observer.next(this.countryFieldForm.controls['country'].value);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private validateCountry(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || (this.country && this.country.code)) {
        return null;
      }
      return { country: true };
    };
  }

  private getAutocompleteQuery$(input: string): Observable<any> {
    return this.countriesHttpService.search(input, 1, 5, 'code', 'code,names').pipe(
      map((resp) => resp.body),
      map((cs) =>
        cs.map((c) => ({
          _id: c._id,
          code: c.code,
          name: this.meaningPipe.transform(c.names)
        }))
      ),
      catchError((err, cause) => {
        this.popupService.showError();
        return EMPTY;
      })
    );
  }

  getCountryErrorMessage(): string {
    const c = this.countryFieldForm.controls['country'];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    } else if (c.hasError('country')) {
      return 'COMMON.COUNTRY_IS_WRONG';
    }
    return null;
  }

  /**
   * Chargement en cours de la recherche des lieux
   */
  doChangeCountryLoading(event: boolean): void {
    this.countryLoading = event;
  }

  /**
   * Un lieu a été selectionné
   */
  doCountrySelected(event): void {
    const country = event.item;
    this.countryFieldForm.get('country_code').setValue(country.code);
    this.loadCountry(country);
  }

  private loadCountry(country: any): void {
    this.countryLoading = true;
    this.countriesHttpService.get(country._id).subscribe(
      (next) => {
        this.countryLoading = false;
        this.country = next;
        this.countryEvent.emit(next);
        this.countryFieldForm.controls['country'].updateValueAndValidity();
        this.propagateChange(next.code);
      },
      (err) => {
        this.countryLoading = false;
        this.popupService.showError();
      }
    );
  }

  /**
   * Efface le lieu enregistré
   */
  doClearCountry(): void {
    this.countryFieldForm.reset();
    this.country = null;
    this.countryEvent.emit(null);
    this.propagateChange(null);
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      this.country = { name: value };
      this.countryFieldForm.controls['country'].setValue(value, { emitEvent: false });
    } else {
      this.country = null;
      this.countryFieldForm.controls['country'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.countryFieldForm.disable({ emitEvent: false });
    } else {
      this.countryFieldForm.enable({ emitEvent: false });
    }
  }
}
