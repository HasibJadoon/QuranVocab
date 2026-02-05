import { Injectable } from '@angular/core';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { Observable } from 'rxjs';
import { McitPdfViewerModalComponent } from './pdf-viewer-modal.component';

export type PdfFile = {
  name: string;
  content: Uint8Array;
};

@Injectable()
export class McitPdfViewerModalService {
  constructor(private dialog: McitDialog) {}

  viewPdf(pdf: PdfFile): Observable<any> {
    const ref = this.dialog.open<McitPdfViewerModalComponent, PdfFile, undefined>(McitPdfViewerModalComponent, {
      dialogClass: 'modal-xl',
      disableClose: false,
      data: pdf
    });
    return ref.afterClosed();
  }
}
