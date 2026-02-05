import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-vehicle-moving-field',
  templateUrl: './vehicle-moving-field.component.html',
  styleUrls: ['./vehicle-moving-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitVehicleMovingFieldComponent),
      multi: true
    }
  ]
})
export class McitVehicleMovingFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.movingFieldForm.get('moving').setValidators(Validators.compose(lodash.compact([_required ? Validators.required : null])));
  }

  get required(): boolean {
    return this._required;
  }

  movingFieldForm: FormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: FormBuilder) {
    this.movingFieldForm = this.formBuilder.group({
      moving: ['', Validators.compose(lodash.compact([this.required ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    const dc = this.movingFieldForm.get('moving');
    this.subscriptions.push(
      dc.statusChanges.subscribe((next) => {
        if (dc.valid) {
          this.propagateChange(dc.value);
        } else {
          this.propagateChange(null);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  writeValue(value: any) {
    if (value && typeof value === 'boolean') {
      this.movingFieldForm.controls['moving'].setValue(value, { emitEvent: false });
    } else {
      this.movingFieldForm.controls['moving'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.movingFieldForm.controls['moving'].disable({ emitEvent: false });
    } else {
      this.movingFieldForm.controls['moving'].enable({ emitEvent: false });
    }
  }
}
