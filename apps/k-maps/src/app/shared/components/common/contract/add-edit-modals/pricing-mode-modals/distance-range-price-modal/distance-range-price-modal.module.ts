import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../../../../dialog/dialog.module';
import { McitFormsModule } from '../../../../forms/forms.module';
import { McitDistanceRangePriceModalComponent } from './distance-range-price-modal.component';
import { McitDistanceRangePriceModalService } from './distance-range-price-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, McitFormsModule, McitDialogModule],
  declarations: [McitDistanceRangePriceModalComponent],
  providers: [McitDistanceRangePriceModalService]
})
export class McitDistanceRangePriceModalModule {}
