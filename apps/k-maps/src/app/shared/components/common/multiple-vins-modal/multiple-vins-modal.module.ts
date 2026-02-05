import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { McitMultipleVinsModalComponent } from './multiple-vins-modal.component';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { McitMultipleVinsModalService } from './multiple-vins-modal.service';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitUploadModule } from '../upload/upload.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, McitCommonModule, McitDialogModule, McitUploadModule, CodemirrorModule, McitTooltipModule],
  declarations: [McitMultipleVinsModalComponent],
  providers: [McitMultipleVinsModalService]
})
export class McitMultipleVinsModalModule {}
