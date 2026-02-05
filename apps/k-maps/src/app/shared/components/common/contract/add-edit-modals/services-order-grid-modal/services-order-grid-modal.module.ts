import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../../../common/common.module';
import { McitDialogModule } from '../../../dialog/dialog.module';
import { McitImportGridXlsxModule } from '../../../import-grid-xlsx-modal/import-grid-xlsx.module';
import { ServicesOrderGridModalComponent } from './services-order-grid-modal.component';
import { ServicesOrderGridModalService } from './services-order-grid-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, McitDialogModule, McitImportGridXlsxModule],
  declarations: [ServicesOrderGridModalComponent],
  providers: [ServicesOrderGridModalService]
})
export class ServicesOrderGridModalModule {}
