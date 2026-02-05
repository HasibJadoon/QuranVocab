import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../common/common.module';
import { McitMonthCalendarComponent } from './month-calendar.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';
import { McitDateLocalFieldModule } from '../date-local-field/date-local-field.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, MatDatepickerModule, ReactiveFormsModule, McitDateLocalFieldModule, McitTooltipModule],
  declarations: [McitMonthCalendarComponent],
  exports: [McitMonthCalendarComponent]
})
export class McitMonthCalendarModule {}
