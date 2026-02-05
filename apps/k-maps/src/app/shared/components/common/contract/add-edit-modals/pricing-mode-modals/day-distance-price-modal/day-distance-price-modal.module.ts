import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../../../../dialog/dialog.module';
import { McitFormsModule } from '../../../../forms/forms.module';
import { McitDayDistancePriceModalComponent } from './day-distance-price-modal.component';
import { McitDayDistancePriceModalService } from './day-distance-price-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, McitFormsModule, McitDialogModule],
  declarations: [McitDayDistancePriceModalComponent],
  providers: [McitDayDistancePriceModalService]
})
export class McitDayDistancePriceModalModule {}
