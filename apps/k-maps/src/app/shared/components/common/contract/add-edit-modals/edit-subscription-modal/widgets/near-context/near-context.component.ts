import { Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'mcit-near-context',
  templateUrl: './near-context.component.html',
  styleUrls: ['./near-context.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NearContextComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NearContextComponent),
      multi: true
    }
  ]
})
export class NearContextComponent implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  form: UntypedFormGroup;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder) {
    this.form = this.formBuilder.group({
      ray: [null, Validators.compose([Validators.required, Validators.min(200), Validators.max(100000)])]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.form.valueChanges.pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe((next) => {
        if (this.propagateChange != null) {
          this.propagateChange({
            near: next
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
    if (obj?.near == null) {
      this.form.reset();
    } else {
      this.form.patchValue(obj.near);
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
    return this.form.invalid ? { near: true } : null;
  }
}
