import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

@Component({
  selector: 'mcit-choose-date-modal',
  templateUrl: './choose-date-modal.component.html',
  styleUrls: ['./choose-date-modal.component.scss']
})
export class McitChooseDateModalComponent implements OnInit {
  title: string;
  question: string;
  negativeAction: string;
  positiveAction: string;
  danger: boolean;
  initialDate: Date;

  form: UntypedFormGroup;

  constructor(private dialogRef: McitDialogRef<McitChooseDateModalComponent, boolean>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.title = data.title;
    this.question = data.question;
    this.negativeAction = data.negativeAction;
    this.positiveAction = data.positiveAction;
    this.initialDate = data.initialDate;
    this.danger = data.danger;

    this.form = new UntypedFormGroup({
      targetDate: new UntypedFormControl(this.initialDate)
    });
  }

  ngOnInit(): void {}

  doPositive(): void {
    this.dialogRef.close(this.form.value.targetDate);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
