import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IDerogatory } from '../models/derogatory.model';

@Component({
  selector: 'mcit-derogatory-info-modal',
  templateUrl: './derogatory-info-modal.component.html',
  styleUrls: ['./derogatory-info-modal.component.scss']
})
export class McitDerogatoryInfoModalComponent {
  derogatoryInformation: IDerogatory;

  constructor(private dialogRef: McitDialogRef<McitDerogatoryInfoModalComponent, void>, @Inject(MCIT_DIALOG_DATA) data: IDerogatory) {
    this.derogatoryInformation = data;
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
