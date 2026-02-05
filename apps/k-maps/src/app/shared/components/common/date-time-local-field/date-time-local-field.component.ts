import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { toISODate } from '../helpers/date.helper';

@Component({
  selector: 'mcit-date-time-local-field',
  templateUrl: './date-time-local-field.component.html',
  styleUrls: ['./date-time-local-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitDateTimeLocalFieldComponent),
      multi: true
    }
  ]
})
export class McitDateTimeLocalFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;
  private _timeRequired = false;
  private _showTime = true;

  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.updateDateValidators();
  }

  get required(): boolean {
    return this._required;
  }

  @Input() isDisableReset: boolean;
  @Input() isDisabled = false;
  @Input() greyedOut = false;

  @Input() defaultValue: string;

  @Input() disableDate = false;
  @Input() minDate = null;
  @Input() maxDate = null;
  @Input() startAt = new Date();
  @Input() borderForce = false;
  @Input() size: 'normal' | 'small' | 'large' = 'normal';
  @Input() fontWeight = 'inherit';

  @Input() showTodayButton = false;

  @Input()
  set timeRequired(_timeRequired: boolean) {
    this._timeRequired = _timeRequired;

    if (_timeRequired) {
      this.required = true;
      this.showTime = true;
    }

    this.updateTimeValidators();
  }
  @Input()
  set showTime(value: boolean) {
    this._showTime = value !== false;
    this.handleShowTimeChange();
  }

  get showTime(): boolean {
    return this._showTime;
  }


  get timeRequired(): boolean {
    return this._timeRequired;
  }

  dateFieldForm: UntypedFormGroup;

  times = [];

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.dateFieldForm = this.formBuilder.group({
      date: [''],
      time: ['']
    });

    this.updateDateValidators();
    this.updateTimeValidators();
    this.handleShowTimeChange();
  }

  ngOnInit(): void {
    if (this.isDisabled) {
      this.dateFieldForm.get('date').disable();
      this.dateFieldForm.get('time').disable();
    } else {
      this.dateFieldForm.get('date').enable();
      this.dateFieldForm.get('time').enable();
    }
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        this.times.push(`${lodash.padStart(i.toString(), 2, '0')}:${lodash.padStart(j.toString(), 2, '0')}`);
      }
    }

    this.isDisableReset = this.dateFieldForm?.controls?.['date']?.disabled ?? false;

    if (this.defaultValue) {
      this.writeValue(this.defaultValue);
    }

    this.subscriptions.push(
      this.dateFieldForm.statusChanges.subscribe((next) => {
        if (this.dateFieldForm.valid) {
          const form = this.dateFieldForm.getRawValue();

          if (form.date) {
            const date = form.date as Date;
            const timeString = form.time ? form.time + ':00' : '';

            const setDate = toISODate(date, timeString);
            this.propagateChange(setDate);
          } else {
            this.propagateChange(null);
          }
        } else {
          this.propagateChange(null);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private validateDate(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || c.value instanceof Date) {
        return null;
      }
      return { date: true };
    };
  }

  getDateErrorMessage(): string {
    const c = this.dateFieldForm.controls['date'];
    const t = this.dateFieldForm.controls['time'];
    if (c.hasError('required')) {
      return 'CALENDAR.DATE_IS_MANDATORY';
    } else if (c.hasError('date')) {
      return 'CALENDAR.DATE_IS_WRONG';
    } else if (t.hasError('required')) {
      return 'CALENDAR.TIME_IS_MANDATORY';
    } else if (t.hasError('pattern')) {
      return 'CALENDAR.TIME_IS_WRONG';
    }
    return null;
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      const dateTime = DateTime.fromISO(value);
      this.dateFieldForm.controls['date'].setValue(dateTime.toJSDate(), { emitEvent: false });

      const timeString = value.length >= 16 ? value.substr(11, 5) : null;
      this.dateFieldForm.controls['time'].setValue(timeString, { emitEvent: false });
    } else {
      this.dateFieldForm.controls['date'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  doClear(): void {
    this.dateFieldForm.reset();
  }

  doToday(): void {
    const dt = DateTime.now();
    this.dateFieldForm.get('date').setValue(dt.startOf('day').toJSDate());
    this.dateFieldForm.get('time').setValue(dt.toFormat('HH:mm'));
  }

  myFilter = (d: Date): boolean =>
    (!this.minDate || DateTime.fromJSDate(d).startOf('day') >= DateTime.fromJSDate(new Date(this.minDate)).startOf('day')) &&
    (!this.maxDate || DateTime.fromJSDate(d).startOf('day') <= DateTime.fromJSDate(new Date(this.maxDate)).startOf('day'));

  updateTimeValidators() {
    this.dateFieldForm.get('time').setValidators(Validators.compose(lodash.compact([Validators.pattern(/^$|^[\d]{2}:[\d]{2}$/), this.timeRequired ? Validators.required : null])));
  }

  updateDateValidators() {
    this.dateFieldForm.get('date').setValidators(Validators.compose(lodash.compact([this.validateDate(), this.required ? Validators.required : null])));
  }

  private handleShowTimeChange(): void {
    const control = this.dateFieldForm?.get('time');
    if (!control) {
      return;
    }
    if (this._showTime) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
      control.setValue('', { emitEvent: false });
    }
  }
}
