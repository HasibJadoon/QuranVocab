import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { NgxLoadingModule } from 'ngx-loading';
import { McitCommonModule } from '../common/common.module';
import { McitImageViewerOverlayModule } from '../image-viewer-overlay/image-viewer-overlay.module';
import { McitDocumentsViewerComponent } from './documents-viewer.component';

@NgModule({
  imports: [CommonModule, McitImageViewerOverlayModule, NgxLoadingModule, McitCommonModule, McitTooltipModule],
  declarations: [McitDocumentsViewerComponent],
  exports: [McitDocumentsViewerComponent]
})
export class McitDocumentsViewerModule {}
