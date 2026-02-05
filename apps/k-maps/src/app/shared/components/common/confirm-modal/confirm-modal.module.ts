import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitConfirmModalComponent } from './confirm-modal.component';
import { McitConfirmModalService } from './confirm-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitConfirmModalComponent],
  providers: [McitConfirmModalService]
})
export class McitConfirmModalModule {}
