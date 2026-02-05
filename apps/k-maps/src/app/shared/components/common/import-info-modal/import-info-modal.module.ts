import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitImportInfoModalComponent } from './import-info-modal.component';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitImportInfoModalComponent]
})
export class McitImportInfoModalModule {}
