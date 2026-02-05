import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { IMcitQuestionOptions } from '../question-modal/question-modal.service';

@Component({
  selector: 'mcit-question-acknowledge-modal',
  templateUrl: './question-acknowledge-modal.component.html',
  styleUrls: ['./question-acknowledge-modal.component.scss']
})
export class McitQuestionAcknowledgeModalComponent implements OnInit {
  title: string;
  question: string;
  negativeAction: string;
  positiveAction: string;
  danger: boolean;
  options: IMcitQuestionOptions;
  validationForm: UntypedFormGroup;

  constructor(
    private dialogRef: McitDialogRef<McitQuestionAcknowledgeModalComponent, { result: boolean; checkbox: boolean }>,
    private formBuilder: UntypedFormBuilder,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      title: string;
      question: string;
      negativeAction: string;
      positiveAction: string;
      danger: boolean;
      options: IMcitQuestionOptions;
    }
  ) {
    this.title = data.title;
    this.question = data.question;
    this.negativeAction = data.negativeAction;
    this.positiveAction = data.positiveAction;
    this.danger = data.danger;
    this.options = data.options;
  }

  ngOnInit(): void {
    this.validationForm = this.formBuilder.group({ checkBox: [false] });
    this.validationForm.get('checkBox').valueChanges.subscribe((checkBox) => console.log(checkBox));
  }

  doPositive(): void {
    this.dialogRef.close({ result: true, checkbox: this.validationForm?.get('checkBox')?.value ?? false });
  }

  doClose(): void {
    this.dialogRef.close({ result: false, checkbox: this.validationForm?.get('checkBox')?.value ?? false });
  }
}
