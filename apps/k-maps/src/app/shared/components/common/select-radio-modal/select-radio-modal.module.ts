import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitSelectRadioModalService } from './select-radio-modal.service';
import { McitSelectRadioModalComponent } from './select-radio-modal.component';
import { McitCommonModule } from '../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitCommonModule],
  declarations: [McitSelectRadioModalComponent],
  providers: [McitSelectRadioModalService]
})
export class McitSelectRadioModalModule {}
