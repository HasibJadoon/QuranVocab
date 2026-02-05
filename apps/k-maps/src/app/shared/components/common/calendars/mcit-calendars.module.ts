import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { McitYearCalendarModule } from '../year-calendar/year-calendar.module';
import { McitFormsModule } from '../forms/forms.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitCountryFieldModule } from '../country-field/country-field.module';
import { McitQuestionModalModule } from '../question-modal/question-modal.module';

import { McitCalendarsComponent } from './mcit-calendars.component';
import { CalendarsSynthesisViewComponent } from './calendars-synthesis-view/calendars-synthesis-view.component';
import { EditableCalendarsViewComponent } from './editable-calendars-view/editable-calendars-view.component';
import { AddEditCalendarModalComponent } from './add-edit-calendar-modal/add-edit-calendar-modal.component';
import { DateDetailModalComponent } from './calendars-synthesis-view/date-detail-modal/date-detail-modal.component';
import { McitModifyDateModalModule } from './modify-date-derogatory-modal/modify-date-modal.module';
import { ViewModeTypePipe } from './pipe/view-mode-type.pipe';
import { CalendarsPeriodsViewComponent } from './calendars-periods-view/calendars-periods-view.component';
import { PeriodDetailModalComponent } from './calendars-periods-view/period-detail-modal/period-detail-modal.component';
import { McitDateTimeLocalFieldModule } from '../date-time-local-field/date-time-local-field.module';

@NgModule({
  imports: [
    CommonModule,
    McitYearCalendarModule,
    TranslateModule,
    FormsModule,
    McitFormsModule,
    ReactiveFormsModule,
    McitDialogModule,
    McitCountryFieldModule,
    McitQuestionModalModule,
    McitModifyDateModalModule,
    McitDateTimeLocalFieldModule
  ],
  declarations: [McitCalendarsComponent, CalendarsSynthesisViewComponent, EditableCalendarsViewComponent, AddEditCalendarModalComponent, DateDetailModalComponent, ViewModeTypePipe, CalendarsPeriodsViewComponent, PeriodDetailModalComponent],
  exports: [McitCalendarsComponent]
})
export class McitCalendarsModule {}
