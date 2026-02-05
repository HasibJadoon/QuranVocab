import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { McitPdfViewerModalComponent } from './pdf-viewer-modal.component';
import { McitPdfViewerModalService } from './pdf-viewer-modal.service';

@NgModule({
  imports: [PdfViewerModule, TranslateModule],
  declarations: [McitPdfViewerModalComponent],
  providers: [McitPdfViewerModalService]
})
export class McitPdfViewerModalModule {}
