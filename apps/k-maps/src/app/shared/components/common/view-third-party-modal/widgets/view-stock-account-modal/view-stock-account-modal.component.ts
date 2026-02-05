import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';

@Component({
  selector: 'mcit-view-stock-account-modal',
  templateUrl: './view-stock-account-modal.component.html',
  styleUrls: ['./view-stock-account-modal.component.scss']
})
export class ViewStockAccountModalComponent implements OnInit {
  platform: string;
  principal: string;

  constructor(private dialogRef: McitDialogRef<ViewStockAccountModalComponent>, @Inject(MCIT_DIALOG_DATA) data: { platform: string; principal: string }) {
    this.platform = data.platform;
    this.principal = data.principal;
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
