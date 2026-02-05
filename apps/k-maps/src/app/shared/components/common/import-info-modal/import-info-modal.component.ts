import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

@Component({
  selector: 'mcit-app-import-info-modal',
  templateUrl: './import-info-modal.component.html'
})
export class McitImportInfoModalComponent {
  constructor(private dialogRef: McitDialogRef<McitImportInfoModalComponent>, @Inject(MCIT_DIALOG_DATA) public data: { title: string; infos: [{ key: string; value: string }] }) {}

  doClose(): void {
    this.dialogRef.close();
  }
}
