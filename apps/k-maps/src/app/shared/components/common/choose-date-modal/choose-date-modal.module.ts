import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitChooseDateModalComponent } from './choose-date-modal.component';
import { McitChooseDateModalService } from './choose-date-modal.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { McitDateHelperModule } from '../date-helper/date-helper.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitDialogModule, MatDatepickerModule, LayoutModule, McitDateHelperModule],
  declarations: [McitChooseDateModalComponent],
  providers: [McitChooseDateModalService]
})
export class McitChooseDateModalModule {}
