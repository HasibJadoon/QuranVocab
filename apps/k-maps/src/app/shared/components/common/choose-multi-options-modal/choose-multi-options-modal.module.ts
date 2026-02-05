import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitChooseMultiOptionsModalComponent } from './choose-multi-options-modal.component';
import { McitChooseMultiOptionsModalService } from './choose-multi-options-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitChooseMultiOptionsModalComponent],
  providers: [McitChooseMultiOptionsModalService]
})
export class McitChooseMultiOptionsModalModule {}
