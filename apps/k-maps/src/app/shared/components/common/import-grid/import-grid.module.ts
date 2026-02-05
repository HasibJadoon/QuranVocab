import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitImportGridModalComponent } from './import-grid-modal.component';
import { McitImportGridModalService } from './import-grid-modal.service';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitUploadModule } from '../upload';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitUploadModule],
  declarations: [McitImportGridModalComponent],
  providers: [McitImportGridModalService]
})
export class McitImportGridModule {}
