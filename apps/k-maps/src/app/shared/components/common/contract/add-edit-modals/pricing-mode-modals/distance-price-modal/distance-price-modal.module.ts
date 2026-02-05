import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../../../../dialog/dialog.module';
import { McitFormsModule } from '../../../../forms/forms.module';
import { McitDistancePriceModalComponent } from './distance-price-modal.component';
import { McitDistancePriceModalService } from './distance-price-modal.service';
import { McitCountryFieldModule } from '../../../../country-field/country-field.module';
import { McitCommonModule } from '../../../../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, McitCommonModule, McitFormsModule, McitDialogModule, McitCountryFieldModule],
  declarations: [McitDistancePriceModalComponent],
  providers: [McitDistancePriceModalService]
})
export class McitDistancePriceModalModule {}
