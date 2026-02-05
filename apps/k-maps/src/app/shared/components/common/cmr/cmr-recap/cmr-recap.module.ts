import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../../common/common.module';
import { McitLayoutsModule } from '../../layouts/layouts.module';
import { McitCmrRecapComponent } from './cmr-recap.component';
import { QRCodeModule } from '@lib-shared/angular2-qrcode';
import { McitTagsInputModule } from '../../tags-input/tags-input.module';
import { NgxLoadingModule } from 'ngx-loading';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, McitLayoutsModule, NgxLoadingModule, QRCodeModule, McitTagsInputModule],
  declarations: [McitCmrRecapComponent],
  exports: [McitCmrRecapComponent]
})
export class McitCmrRecapModule {}
