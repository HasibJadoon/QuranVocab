import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitListInfoModalComponent } from './list-info-modal.component';
import { McitListInfoModalService } from './list-info-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitListInfoModalComponent],
  providers: [McitListInfoModalService]
})
export class McitListInfoModalModule {}
