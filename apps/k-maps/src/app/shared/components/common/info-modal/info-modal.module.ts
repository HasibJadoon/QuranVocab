import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitInfoModalComponent } from './info-modal.component';
import { McitInfoModalService } from './info-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitInfoModalComponent],
  providers: [McitInfoModalService]
})
export class McitInfoModalModule {}
