import { McitCmrByVehicleComponent } from './cmr-by-vehicle.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../../common/common.module';
import { McitLayoutsModule } from '../../layouts/layouts.module';
import { QRCodeModule } from '@lib-shared/angular2-qrcode';
import { McitTagsInputModule } from '../../tags-input/tags-input.module';
import { McitChecksModule } from '../../inspection/checks/checks.module';
import { McitDamagesModule } from '../../inspection/damages/damages.module';
import { McitAttachmentsModule } from '../../attachments/attachments.module';
import { NgxLoadingModule } from 'ngx-loading';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, McitLayoutsModule, QRCodeModule, McitTagsInputModule, McitAttachmentsModule, McitChecksModule, McitDamagesModule, NgxLoadingModule],
  declarations: [McitCmrByVehicleComponent],
  exports: [McitCmrByVehicleComponent]
})
export class McitCmrByVehicleModule {}
