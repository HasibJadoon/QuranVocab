import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CountryPhone } from '../models/country';
import { McitCountryService } from '../services/country.service';
import { formatNumber, getCountryCallingCode, isValidNumber, ParsedNumber, parseNumber, parsePhoneNumber } from 'libphonenumber-js';
import { McitChooseCountryPhoneModalService } from '../choose-country-phone-modal/choose-country-phone-modal.service';
import * as lodash from 'lodash';
import { McitSettingsService } from '../services/settings.service';

@Component({
  selector: 'mcit-phone-field',
  templateUrl: './phone-field.component.html',
  styleUrls: ['./phone-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitPhoneFieldComponent),
      multi: true
    }
  ]
})
export class McitPhoneFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() submitAttempt: boolean;

  @Input() labelId?: string;
  @Input() autocomplete?: string;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.phoneFieldForm.get('phone').setValidators(Validators.compose(lodash.compact([Validators.maxLength(256), this.validatePhone(), _required ? Validators.required : null])));
  }

  get required(): boolean {
    return this._required;
  }

  phoneFieldForm: UntypedFormGroup;
  countryPhone: CountryPhone = { code: 'FR', name: 'France', flag: 'fr', indicatif: '+33' };
  @Input() customPlaceholder = '';
  @Input() isRequired = true;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private chooseCountryPhoneModalService: McitChooseCountryPhoneModalService, private countryService: McitCountryService, private settingsService: McitSettingsService) {
    this.phoneFieldForm = this.formBuilder.group({
      phone: ['', Validators.compose(lodash.compact([Validators.maxLength(256), this.validatePhone(), this.required ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.phoneFieldForm.controls['phone'].valueChanges.subscribe((next) => {
        this.formatPhone();
      })
    );

    const telephoneCode = this.settingsService.getSettingsForKey('telephoneCode');
    if (telephoneCode == null) {
      this.countryService.getIPCountry().subscribe((next) => {
        if (next && !this.countryPhone) {
          this.countryPhone = {
            code: next.code,
            name: next.name,
            flag: next.flag,
            indicatif: '+' + getCountryCallingCode(next.code)
          };
        }
      });
    } else {
      this.countryPhone = {
        code: telephoneCode.code,
        name: telephoneCode.name,
        flag: telephoneCode.flag,
        indicatif: telephoneCode.indicatif
      };
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private validatePhone(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const phone = c.value;
      if (phone == null || phone.length === 0 || (phone.substr(0, 1) !== '+' && isValidNumber(phone, this.countryPhone.code))) {
        return null;
      } else if (phone.substr(0, 1) === '+') {
        try {
          const phoneNumber = parsePhoneNumber(phone);
          if (isValidNumber(phoneNumber.nationalNumber, phoneNumber.country)) {
            this.setCountryPhone(phoneNumber.country);
            return null;
          }
        } catch (error) {
          // ignore error
        }
      }
      return { phone: true };
    };
  }

  getPhoneErrorMessage(): string {
    const c = this.phoneFieldForm.controls['phone'];
    if (c.hasError('required')) {
      return 'PHONE-FIELD_COMPONENT.PHONE_REQUIRED';
    } else if (c.hasError('phone')) {
      return 'PHONE-FIELD_COMPONENT.PHONE_WRONG';
    }
    return null;
  }

  doShowCountryModal(): void {
    this.chooseCountryPhoneModalService.chooseCountryPhone(this.countryPhone.code).subscribe((next) => {
      if (next) {
        this.countryPhone = <CountryPhone>next;
        this.phoneFieldForm.controls['phone'].updateValueAndValidity();
      }
    });
  }

  focusOutPhone(): void {
    this.formatPhone();
  }

  private formatPhone(): void {
    const phone = this.phoneFieldForm.controls['phone'].value;
    if (phone && isValidNumber(phone, this.countryPhone.code)) {
      const val = formatNumber(parseNumber(phone, this.countryPhone.code) as ParsedNumber, 'NATIONAL');
      if (phone !== val) {
        this.phoneFieldForm.controls['phone'].setValue(val, { emitEvent: false });
      }
      if (this.propagateChange) {
        this.propagateChange(this.getPhone());
      }
    } else {
      if (this.propagateChange) {
        this.propagateChange(null);
      }
    }
  }

  getPhone(): string {
    const form = this.phoneFieldForm.getRawValue();
    return formatNumber(parseNumber(form.phone, this.countryPhone.code) as ParsedNumber, 'INTERNATIONAL');
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      this.phoneFieldForm.controls['phone'].setValue(value, { emitEvent: false });
      try {
        this.setCountryPhone(parsePhoneNumber(value).country);
      } catch (error) {
        // ignore error
      }
      this.formatPhone();
    } else {
      this.phoneFieldForm.controls['phone'].setValue('', { emitEvent: false });
    }
  }

  public setCountryPhone(country: string) {
    const newCountry = McitCountryService.getCountryPhone(country);
    if (newCountry) {
      this.countryPhone = {
        code: newCountry.code,
        name: newCountry.name,
        flag: newCountry.flag,
        indicatif: '+' + getCountryCallingCode(newCountry.code)
      };
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.phoneFieldForm.controls['phone'].disable({ emitEvent: false });
    } else {
      this.phoneFieldForm.controls['phone'].enable({ emitEvent: false });
    }
  }
}
