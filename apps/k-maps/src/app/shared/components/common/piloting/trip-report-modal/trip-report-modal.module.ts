import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { CommonModule } from '@angular/common';
import { McitUploadModule } from '@lib-shared/common/upload';
import { TripReportModalComponent } from './trip-report-modal.component';
import { TripReportModalService } from './trip-report-modal.service';
import { McitTableModule } from '@lib-shared/common/table/table.module';

@NgModule({
  imports: [CommonModule, McitCommonModule, TranslateModule, McitUploadModule, McitTableModule],
  declarations: [TripReportModalComponent],
  providers: [TripReportModalService]
})
export class TripReportModule {}
