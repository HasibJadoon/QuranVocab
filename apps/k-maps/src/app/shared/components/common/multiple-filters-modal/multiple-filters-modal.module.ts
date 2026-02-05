import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { McitMultipleFiltersModalComponent } from './multiple-filters-modal.component';
import { LocalUploadService } from './local-upload.service';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { McitMultipleFiltersModalService } from './multiple-filters-modal.service';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitUploadModule } from '../upload/upload.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, McitCommonModule, McitDialogModule, McitUploadModule, CodemirrorModule, McitTooltipModule],
  declarations: [McitMultipleFiltersModalComponent],
  providers: [LocalUploadService, McitMultipleFiltersModalService]
})
export class McitMultipleFiltersModalModule {}
