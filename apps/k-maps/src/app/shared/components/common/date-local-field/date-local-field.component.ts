import { Component, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, ValidatorFn, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mcit-date-local-field',
  templateUrl: './date-local-field.component.html',
  styleUrls: ['./date-local-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitDateLocalFieldComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitDateLocalFieldComponent),
      multi: true
    }
  ]
})
export class McitDateLocalFieldComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor, Validator {
  private _required = false;
  private _placeHolder: any;

  @Input() submitAttempt: boolean;
  @Input() size: 'normal' | 'small' | 'large' = 'normal';
  @Input() showPrevNext = false;
  @Input() showTodayButton = false;
  @Input() showClearDate = false;
  @Input() minDate = null;
  @Input() maxDate = null;
  @Input() relativeToErrors: object | false | null = null;
  @Input() isDisabled = false;
  @Input() resetPristineAndUntouched: boolean;
  @Input() borderForce = false;
  @Input() startAt = new Date();

  @Input()
  set required(_required: boolean) {
    this._required = _required;
    this.dateFieldForm.get('date').setValidators(Validators.compose([...lodash.compact([this.validateDate(), _required ? Validators.required : null]), this.validateRelativeDateConstraint()]));
  }

  get required(): boolean {
    return this._required;
  }

  @Output()
  prevEvent = new EventEmitter<void>();
  @Output()
  nextEvent = new EventEmitter<void>();

  dateFieldForm: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.dateFieldForm = this.formBuilder.group({
      date: ['', Validators.compose([...lodash.compact([this.validateDate(), this._required ? Validators.required : null]), this.validateRelativeDateConstraint()])]
    });
  }

  ngOnInit(): void {
    const dc = this.dateFieldForm.get('date');
    if (this.isDisabled) {
      dc.disable({ emitEvent: false });
    }
    this.subscriptions.push(
      dc.statusChanges.subscribe((next) => {
        if (!this.propagateChange) {
          return;
        }
        if (dc.value && dc.value instanceof Date) {
          const date = dc.value as Date;
          try {
            const year = lodash.padStart(date.getFullYear().toString(), 4, '0');
            const month = lodash.padStart((date.getMonth() + 1).toString(), 2, '0');
            const day = lodash.padStart(date.getDate().toString(), 2, '0');
            const dateString = `${year}-${month}-${day}`;
            this.propagateChange(dateString);
          } catch (e) {
            this.propagateChange(null);
          }
        } else if (dc.value) {
          this.propagateChange(dc.value);
        } else {
          this.propagateChange(null);
        }
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.relativeToErrors && changes.relativeToErrors.currentValue !== changes.relativeToErrors.previousValue) {
      if (this.dateFieldForm.get('date')) {
        this.dateFieldForm.get('date').updateValueAndValidity();
      }
    } else if (changes && changes.resetPristineAndUntouched) {
      this.dateFieldForm.get('date').markAsPristine();
      this.dateFieldForm.get('date').markAsUntouched();
    }
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

  private validateRelativeDateConstraint(): ValidatorFn {
    return (): ValidationErrors | null => {
      if (this.relativeToErrors) {
        return { validateDateRelativeTo: this.relativeToErrors };
      }
      return null;
    };
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return lodash.get(this.dateFieldForm.get('date'), 'errors.length') > 0 ? this.dateFieldForm.get('date').errors : null;
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      this.dateFieldForm.controls['date'].setValue(new Date(value), { emitEvent: false });
    } else {
      this.dateFieldForm.controls['date'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.dateFieldForm.controls['date'].disable({ emitEvent: false });
    } else {
      this.dateFieldForm.controls['date'].enable({ emitEvent: false });
    }
  }

  doPrev(): void {
    this.prevEvent.emit();
  }

  doNext(): void {
    this.nextEvent.emit();
  }

  doToday(): void {
    this.dateFieldForm.get('date').setValue(new Date());
  }

  doClearDate() {
    this.dateFieldForm.get('date').setValue('');
  }

  myFilter = (d: Date): boolean =>
    (!this.minDate || DateTime.fromJSDate(d).startOf('day') >= DateTime.fromJSDate(new Date(this.minDate)).startOf('day')) &&
    (!this.maxDate || DateTime.fromJSDate(d).startOf('day') <= DateTime.fromJSDate(new Date(this.maxDate)).startOf('day'));
}
