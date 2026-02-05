import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { McitReferencesModalComponent } from './references-modal.component';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { McitReferencesModalService } from './references-modal.service';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, McitCommonModule, McitDialogModule, CodemirrorModule, McitTooltipModule],
  declarations: [McitReferencesModalComponent],
  providers: [McitReferencesModalService]
})
export class McitReferencesModalModule {}
