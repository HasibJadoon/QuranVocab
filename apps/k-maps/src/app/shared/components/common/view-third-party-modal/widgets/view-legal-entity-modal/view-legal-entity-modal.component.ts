import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';

@Component({
  selector: 'mcit-view-legal-entity-modal',
  templateUrl: './view-legal-entity-modal.component.html',
  styleUrls: ['./view-legal-entity-modal.component.scss']
})
export class ViewLegalEntityModalComponent implements OnInit {
  legalEntity: any;

  constructor(private dialogRef: McitDialogRef<ViewLegalEntityModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.legalEntity = data;
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
