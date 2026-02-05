import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { McitCommonModule } from '../common/common.module';

import { McitYearCalendarComponent } from './year-calendar.component';
import { McitMonthCalendarModule } from '../month-calendar/month-calendar.module';
import { McitFormsModule } from '../forms/forms.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, McitMonthCalendarModule, FormsModule, McitFormsModule, ReactiveFormsModule],
  declarations: [McitYearCalendarComponent],
  exports: [McitYearCalendarComponent]
})
export class McitYearCalendarModule {}
