import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IMcitQuestionOptions } from './question-modal.service';

@Component({
  selector: 'mcit-question-modal',
  templateUrl: './question-modal.component.html',
  styleUrls: ['./question-modal.component.scss']
})
export class McitQuestionModalComponent implements OnInit {
  title: string;
  question: string;
  negativeAction: string;
  positiveAction: string;
  danger: boolean;
  options: IMcitQuestionOptions;

  constructor(
    private dialogRef: McitDialogRef<McitQuestionModalComponent, boolean>,
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

  ngOnInit(): void {}

  doPositive(): void {
    this.dialogRef.close(true);
  }

  doClose(): void {
    this.dialogRef.close(false);
  }
}
