import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { McitImageViewerOverlayService } from './image-viewer-overlay.service';
import { McitImageViewerOverlayContainerComponent } from './image-viewer-overlay-container.component';
import { McitPinchZoomComponent } from './widgets/pinch-zoom/pinch-zoom.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgxLoadingModule } from 'ngx-loading';
import { McitCommonModule } from '../common/common.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitAttachmentToBase64Pipe } from '../common/pipes/attachments-to-base64.pipe';

@NgModule({
  imports: [CommonModule, McitCommonModule, OverlayModule, PortalModule, MatToolbarModule, NgxLoadingModule, McitTooltipModule, TranslateModule],
  declarations: [McitPinchZoomComponent, McitImageViewerOverlayContainerComponent],
  providers: [McitImageViewerOverlayService, McitAttachmentToBase64Pipe]
})
export class McitImageViewerOverlayModule {}
