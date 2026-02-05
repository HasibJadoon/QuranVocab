import { ChangeDetectorRef, Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, ValidatorFn, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { Subscription } from 'rxjs';

import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';

@Component({
  selector: 'mcit-vehicle-id-field',
  templateUrl: './vehicle-id-field.component.html',
  styleUrls: ['./vehicle-id-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitVehicleIdFieldComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitVehicleIdFieldComponent),
      multi: true
    }
  ]
})
export class McitVehicleIdFieldComponent implements OnInit, OnDestroy, Validator, ControlValueAccessor {
  private _required = false;
  private _vinformat = false;

  @Input() isDisabled = false;
  @Input() submitAttempt: boolean;
  @Input()
  set required(_required: boolean) {
    this._required = _required;
    if (this.vehicleFieldForm) {
      this.vehicleFieldForm.setValidators(lodash.compact([this._required ? this.requireOne() : null]));
    }
  }

  get required(): boolean {
    return this._required;
  }

  @Input()
  set validateVinFormat(check: boolean) {
    this._vinformat = check;
    if (this.vehicleFieldForm) {
      this.vehicleFieldForm.get('vin').setValidators(lodash.compact([Validators.maxLength(17), this._vinformat ? Validators.pattern(/^[A-Z0-9]{17}$/) : null]));
    }
  }

  get validateVinFormat(): boolean {
    return this._required;
  }

  vehicleFieldForm: UntypedFormGroup;

  mode = 'vin';

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private menuDropdownService: McitMenuDropdownService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.vehicleFieldForm = this.formBuilder.group(
      {
        vin: [{ value: '', disabled: this.isDisabled }, Validators.compose(lodash.compact([Validators.maxLength(17), this._vinformat ? Validators.pattern(/^[A-Z0-9]{17}$/) : null]))],
        license_plate: [{ value: '', disabled: this.isDisabled }, Validators.compose(lodash.compact([Validators.maxLength(20)]))],
        x_vin: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])]
      },
      { validators: lodash.compact([this._required ? this.requireOne() : null]) }
    );
    this.subscriptions.push(
      this.vehicleFieldForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          const obj = {
            vin: '',
            x_vin: '',
            license_plate: ''
          };
          ['vin', 'x_vin', 'license_plate'].forEach((f) => {
            const c = this.vehicleFieldForm.get(f);
            c.setValue(c.value.toUpperCase(), { emitEvent: false });
            if (c.valid) {
              obj[f] = c.value;
            }
          });
          this.propagateChange(obj);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  doChangeMode(modeButton): void {
    this.menuDropdownService
      .chooseOptions(modeButton, [
        { code: 'vin', nameKey: 'VEHICLE_ID_FIELD.VIN' },
        { code: 'x_vin', nameKey: 'VEHICLE_ID_FIELD.X_VIN' },
        { code: 'license_plate', nameKey: 'VEHICLE_ID_FIELD.LICENSE_PLATE' }
      ])
      .subscribe((key) => {
        if (key) {
          this.mode = key;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  getModeNameKey(): string {
    switch (this.mode) {
      case 'vin':
        return 'VEHICLE_ID_FIELD.VIN';
      case 'x_vin':
        return 'VEHICLE_ID_FIELD.X_VIN';
      case 'license_plate':
        return 'VEHICLE_ID_FIELD.LICENSE_PLATE';
    }
    return '';
  }

  writeValue(value: any) {
    if (value) {
      this.vehicleFieldForm.patchValue(
        {
          vin: value.vin ? value.vin : '',
          license_plate: value.license_plate ? value.license_plate : '',
          x_vin: value.x_vin ? value.x_vin : ''
        },
        { emitEvent: false }
      );
      if (value.vin) {
        this.mode = 'vin';
      } else if (value.license_plate) {
        this.mode = 'license_plate';
      } else if (value.x_vin) {
        this.mode = 'x_vin';
      } else {
        this.mode = 'vin';
      }
    } else {
      this.mode = 'vin';
      this.vehicleFieldForm.patchValue(
        {
          vin: '',
          license_plate: '',
          x_vin: ''
        },
        { emitEvent: false }
      );
    }
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  validate(control: AbstractControl): ValidationErrors | null {
    let valid = true;
    ['vin', 'x_vin', 'license_plate'].forEach((f) => {
      valid = valid && this.vehicleFieldForm.get(f).valid;
    });

    if (!valid) {
      return {
        invalid: true
      };
    }
    return lodash.get(control, 'errors.length') > 0 ? control.errors : null;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    ['vin', 'x_vin', 'license_plate'].forEach((f) => {
      if (isDisabled) {
        this.vehicleFieldForm.get(f).disable({ emitEvent: false });
      } else {
        this.vehicleFieldForm.get(f).enable({ emitEvent: false });
      }
    });
  }

  requireOne(): ValidatorFn {
    return (form: UntypedFormGroup): ValidationErrors | null => {
      const hasOne = ['vin', 'x_vin', 'license_plate'].map((key) => form.get(key).value).find((value) => !lodash.isNil(value) && value.length > 0);
      if (hasOne) {
        return null;
      }
      return { identifier: 'VEHICLE_ID_FIELD.REQUIRES_ONE' };
    };
  }
}
