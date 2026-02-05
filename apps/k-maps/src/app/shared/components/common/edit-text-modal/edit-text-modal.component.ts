import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CountryPhone } from '../models/country';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PublicHttpService } from '../https/public-http.service';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

@Component({
  selector: 'mcit-edit-text-modal',
  templateUrl: './edit-text-modal.component.html',
  styleUrls: ['./edit-text-modal.component.scss']
})
export class McitEditTextModalComponent implements OnInit {
  title: string;
  id: string;
  type: 'text' | 'number' | 'email' | 'phone';
  mandatory: boolean;
  textForm: UntypedFormGroup;
  value: any;
  countryPhone: CountryPhone = { code: 'FR', name: 'France', flag: 'fr', indicatif: '+33' };

  constructor(private dialogRef: McitDialogRef<McitEditTextModalComponent, { value: string }>, private formBuilder: UntypedFormBuilder, private publicHttpService: PublicHttpService, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.id = data.id;
    this.title = data.title;
    this.value = data.value;
    this.type = data.type;
    this.mandatory = data.mandatory;
  }

  ngOnInit(): void {
    const validators = [];
    const validatorAsyncs = [];

    validators.push(Validators.maxLength(256));
    if (this.mandatory) {
      validators.push(Validators.required);
    }
    if (this.type === 'text') {
    } else if (this.type === 'number') {
    } else if (this.type === 'email') {
      validators.push(Validators.email);
      validatorAsyncs.push(this.validEmail());
    } else if (this.type === 'phone') {
    } else if (this.type === 'password') {
    }

    this.textForm = this.formBuilder.group({
      text: ['', Validators.compose(validators), Validators.composeAsync(validatorAsyncs)]
    });

    this.textForm.setValue({
      text: this.value ? this.value : ''
    });
  }

  private validEmail(): AsyncValidatorFn {
    return (c: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      const email = c.value;
      if (email === this.value) {
        return of(null);
      }
      return this.publicHttpService.validEmail(email).pipe(
        map((e) => (e && e.valid ? null : { invalidEmail: true })),
        catchError((err, cause) => of({ invalidEmail: true }))
      );
    };
  }

  getTextMessage(): string {
    const c = this.textForm.controls['text'];
    if (c.hasError('required')) {
      return 'EDIT-TEXT-MODAL_COMPONENT.MANDATORY_FIELD';
    } else if (c.hasError('email')) {
      return 'EDIT-TEXT-MODAL_COMPONENT.EMAIL_WRONG';
    } else if (c.hasError('invalidEmail')) {
      return 'EDIT-TEXT-MODAL_COMPONENT.EMAIL_ALREADY_USED';
    }
    return null;
  }

  doSubmit(): void {
    if (!this.textForm.valid) {
      return;
    }
    this.dialogRef.close({ value: this.textForm.getRawValue().text });
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
