import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IMcitConfirmExtras } from './confirm-modal.service';

@Component({
  selector: 'mcit-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class McitConfirmModalComponent implements OnInit {
  title: string;
  messageKey: string;
  extras: IMcitConfirmExtras;

  constructor(
    private dialogRef: McitDialogRef<McitConfirmModalComponent, void>,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      title: string;
      messageKey: string;
      extras: IMcitConfirmExtras;
    }
  ) {
    this.title = data.title;
    this.messageKey = data.messageKey;
    this.extras = data.extras;
  }

  ngOnInit(): void {}

  doConfirm(): void {
    this.dialogRef.close();
  }
}
