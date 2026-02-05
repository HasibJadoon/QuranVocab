import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitChooseOptionsModalComponent } from './choose-options-modal.component';
import { McitChooseOptionsModalService } from './choose-options-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitChooseOptionsModalComponent],
  providers: [McitChooseOptionsModalService]
})
export class McitChooseOptionsModalModule {}
