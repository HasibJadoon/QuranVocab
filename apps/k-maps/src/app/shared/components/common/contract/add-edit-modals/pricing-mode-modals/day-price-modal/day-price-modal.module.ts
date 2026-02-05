import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../../../../dialog/dialog.module';
import { McitFormsModule } from '../../../../forms/forms.module';
import { McitDayPriceModalComponent } from './day-price-modal.component';
import { McitDayPriceModalService } from './day-price-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, McitFormsModule, McitDialogModule],
  declarations: [McitDayPriceModalComponent],
  providers: [McitDayPriceModalService]
})
export class McitDayPriceModalModule {}
