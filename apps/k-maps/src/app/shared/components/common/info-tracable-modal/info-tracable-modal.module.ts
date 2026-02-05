import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitInfoTracableModalComponent } from './info-tracable-modal.component';
import { McitCommonModule } from '../common/common.module';
import { McitInfoTracableModalService } from './info-tracable-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitCommonModule],
  declarations: [McitInfoTracableModalComponent],
  providers: [McitInfoTracableModalService]
})
export class McitInfoTracableModalModule {}
