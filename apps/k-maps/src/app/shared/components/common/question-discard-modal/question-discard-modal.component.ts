import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { McitQuestionDiscardParamsEnum, IMcitQuestionDiscardOptions } from './question-discard.model';

@Component({
  selector: 'mcit-question-discard-modal',
  templateUrl: './question-discard-modal.component.html',
  styleUrls: ['./question-discard-modal.component.scss']
})
export class McitQuestionDiscardModalComponent implements OnInit {
  title: string;
  question: string;
  discardAction: string;
  saveAction: string;
  cancelAction: string;
  danger: boolean;
  options: IMcitQuestionDiscardOptions;

  constructor(private dialogRef: McitDialogRef<McitQuestionDiscardModalComponent, string>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.title = data.title;
    this.question = data.question;
    this.discardAction = data.discardAction;
    this.saveAction = data.saveAction;
    this.cancelAction = data.cancelAction;
    this.danger = data.danger;
    this.options = data.options;
  }

  ngOnInit(): void {}

  doSave(): void {
    this.dialogRef.close(McitQuestionDiscardParamsEnum.save);
  }

  doDiscard(): void {
    this.dialogRef.close(McitQuestionDiscardParamsEnum.discard);
  }
  doClose(): void {
    this.dialogRef.close(McitQuestionDiscardParamsEnum.cancel);
  }
}
