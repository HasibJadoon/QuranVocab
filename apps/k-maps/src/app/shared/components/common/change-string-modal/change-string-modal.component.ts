import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IMcitChangeStringExtras } from './change-string-modal.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'mcit-change-string-modal',
  templateUrl: './change-string-modal.component.html',
  styleUrls: ['./change-string-modal.component.scss']
})
export class McitChangeStringModalComponent implements OnInit {
  form: UntypedFormGroup;
  title: string;
  messageKey: string;
  extras: IMcitChangeStringExtras;
  value: string;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dialogRef: McitDialogRef<McitChangeStringModalComponent, string>,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      title: string;
      messageKey: string;
      value: string;
      extras: IMcitChangeStringExtras;
    }
  ) {
    this.title = data.title;
    this.messageKey = data.messageKey;
    this.value = data.value;
    this.extras = data.extras;
    this.form = this.formBuilder.group({
      value: [data.value, this.extras.regex ? [Validators.required, Validators.pattern(this.extras.regex)] : Validators.required]
    });
  }

  ngOnInit(): void {}

  doConfirm(): void {
    this.dialogRef.close(this.form.value.value);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
