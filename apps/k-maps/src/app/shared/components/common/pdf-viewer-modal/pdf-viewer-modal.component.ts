import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { PdfFile } from '@lib-shared/common/pdf-viewer-modal/pdf-viewer-modal.service';

@Component({
  selector: 'app-bill-of-lading-display-modal',
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.scss']
})
export class McitPdfViewerModalComponent {
  pdf: PdfFile;

  constructor(private dialogRef: McitDialogRef<McitPdfViewerModalComponent>, @Inject(MCIT_DIALOG_DATA) pdf: PdfFile) {
    this.pdf = pdf;
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
