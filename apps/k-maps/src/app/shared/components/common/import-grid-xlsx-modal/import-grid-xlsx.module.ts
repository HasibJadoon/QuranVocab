import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitUploadModule } from '../upload';
import { McitImportGridXlsxModalComponent } from './import-grid-xlsx-modal.component';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitUploadModule],
  declarations: [McitImportGridXlsxModalComponent]
})
export class McitImportGridXlsxModule {}
