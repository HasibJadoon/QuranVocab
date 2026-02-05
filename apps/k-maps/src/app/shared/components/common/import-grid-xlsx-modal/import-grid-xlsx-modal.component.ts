import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { McitPopupService } from '../services/popup.service';

@Component({
  selector: 'mcit-import-grid-xlsx-modal',
  templateUrl: './import-grid-xlsx-modal.component.html',
  styleUrls: ['./import-grid-xlsx-modal.component.scss']
})
export class McitImportGridXlsxModalComponent {
  uploadFileTypes: string[] = ['xlsx'];
  public serviceUploadEndpoint: string;
  description: string;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData, private popupService: McitPopupService, private dialogRef: McitDialogRef<McitImportGridXlsxModalComponent>) {
    this.description = this.modalData.description ?? 'COMMON_CONTRACTS.MODAL.IMPORT_PRICING_GRID.TITLE';
    this.serviceUploadEndpoint = this.modalData.serviceUploadEndpoint;
  }

  onUploadEnded(event: any): void {
    if (event.response.body) {
      this.dialogRef.close(event.response.body);
    } else if (event.response.status === 400) {
      this.popupService.showError('IMPORT_PRICING_GRID.ERROR_400_GRID');
      this.dialogRef.close();
    } else {
      this.popupService.showError();
      this.dialogRef.close();
    }
  }

  onUploadError(event: any): void {
    this.popupService.showError();
  }
}
