import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';

@Component({
  selector: 'mcit-view-carrier-software-modal',
  templateUrl: './view-carrier-software-modal.component.html',
  styleUrls: ['./view-carrier-software-modal.component.scss']
})
export class ViewCarrierSoftwareModalComponent implements OnInit {
  carrierSoftware: string;

  constructor(private dialogRef: McitDialogRef<ViewCarrierSoftwareModalComponent>, @Inject(MCIT_DIALOG_DATA) data: string) {
    this.carrierSoftware = data;
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
