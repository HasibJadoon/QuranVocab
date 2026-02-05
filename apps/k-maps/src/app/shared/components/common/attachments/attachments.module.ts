import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxLoadingModule } from 'ngx-loading';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitAttachmentsComponent } from './attachments.component';
import { McitCommonModule } from '../common/common.module';
import { McitLayoutsModule } from '../layouts/layouts.module';
import { McitAttachmentsHttpService } from './attachments-http.service';
import { McitAttachementsActionModalComponent } from './attachments-action-modal/attachments-action-modal.component';
import { McitImageViewerOverlayService } from '../image-viewer-overlay/image-viewer-overlay.service';
import { McitAttachmentsSyncStatusPipe } from './pipes/attachments-sync-status.pipe';
import { McitAttachmentToBase64Pipe } from '../common/pipes/attachments-to-base64.pipe';
import { McitAttachmentIsImagePipe } from '@lib-shared/common/attachments/pipes/attachment-is-image.pipe';
import { McitNativeFileSystemModule } from '@lib-shared/common/file/native-file-system.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, TranslateModule, NgxLoadingModule, FormsModule, McitCommonModule, McitLayoutsModule, ReactiveFormsModule, MatGridListModule, McitNativeFileSystemModule, McitTooltipModule],
  declarations: [McitAttachmentsComponent, McitAttachementsActionModalComponent, McitAttachmentsSyncStatusPipe, McitAttachmentIsImagePipe],
  providers: [McitAttachmentsHttpService, McitImageViewerOverlayService, McitAttachmentToBase64Pipe, McitAttachmentIsImagePipe],
  exports: [McitAttachmentsComponent, McitAttachementsActionModalComponent, McitAttachmentsSyncStatusPipe, McitAttachmentIsImagePipe]
})
export class McitAttachmentsModule {}
