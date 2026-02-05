import { Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'mcit-before-day-context',
  templateUrl: './before-day-context.component.html',
  styleUrls: ['./before-day-context.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BeforeDayContextComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BeforeDayContextComponent),
      multi: true
    }
  ]
})
export class BeforeDayContextComponent implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  form: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.form = this.formBuilder.group({
      source: ['', Validators.required],
      days: [null, Validators.compose([Validators.required, Validators.min(0), Validators.max(10)])]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.form.valueChanges.pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe((next) => {
        if (this.propagateChange != null) {
          this.propagateChange({
            before_day: next
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(obj: any): void {
    if (obj?.before_day == null) {
      this.form.reset();
    } else {
      this.form.patchValue(obj.before_day);
    }
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable({
        emitEvent: false
      });
    } else {
      this.form.enable({
        emitEvent: false
      });
    }
  }

  registerOnValidatorChange(fn: () => void): void {}

  validate(control: AbstractControl): ValidationErrors | null {
    return this.form.invalid ? { before_day: true } : null;
  }
}
