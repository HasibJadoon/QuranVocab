import { Component, Inject } from '@angular/core';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { McitDialogRef } from '../dialog/dialog-ref';
import { ITracable } from '../models/types.model';

interface ICustomTracable extends ITracable {
  users?: string[];
}

@Component({
  selector: 'mcit-info-tracable-modal',
  templateUrl: './info-tracable-modal.component.html',
  styleUrls: ['./info-tracable-modal.component.scss']
})
export class McitInfoTracableModalComponent {
  constructor(private dialogRef: McitDialogRef<McitInfoTracableModalComponent>, @Inject(MCIT_DIALOG_DATA) public data: { title: string; trace: ICustomTracable }) {}

  goBack(): void {
    this.dialogRef.close();
  }
}
