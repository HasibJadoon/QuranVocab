import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IOptions } from './edit-text-area-modal.service';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-edit-text-area-modal',
  templateUrl: './edit-text-area-modal.component.html',
  styleUrls: ['./edit-text-area-modal.component.scss']
})
export class McitEditTextAreaModalComponent implements OnInit {
  title: string;
  informationText: string;
  positiveKey: string;
  negativeKey: string;
  options: IOptions;
  textForm: UntypedFormGroup;

  constructor(private dialogRef: McitDialogRef<McitEditTextAreaModalComponent, { value: string }>, private formBuilder: UntypedFormBuilder, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.title = data.title;
    this.informationText = data.informationText;
    this.positiveKey = data.positiveKey;
    this.negativeKey = data.negativeKey;
    this.options = data.options;
  }

  ngOnInit(): void {
    const validators = [];

    validators.push(Validators.maxLength(lodash.get(this.options, 'maxLength', 256)));
    if (lodash.get(this.options, 'mandatory', false)) {
      validators.push(Validators.required);
    }

    this.textForm = this.formBuilder.group({
      text: [this.options?.defaultValue ?? '', Validators.compose(validators)]
    });
  }

  getTextMessage(): string {
    const c = this.textForm.controls['text'];
    if (c.hasError('required')) {
      return 'EDIT-TEXT-AREA-MODAL_COMPONENT.MANDATORY_FIELD';
    }
    return null;
  }

  doPositive(): void {
    if (!this.textForm.valid) {
      return;
    }
    this.dialogRef.close({ value: this.textForm.getRawValue().text });
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
