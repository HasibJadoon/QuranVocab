import { Component, Inject, OnDestroy, OnInit } from '@angular/core';

import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { CalendarTypes } from '../../../models/calendar.model';

@Component({
  selector: 'mcit-date-detail-modal',
  templateUrl: './date-detail-modal.component.html',
  styleUrls: ['./date-detail-modal.component.scss']
})
export class DateDetailModalComponent implements OnInit, OnDestroy {
  invoicingCalendars: { code: string; name: string }[];
  publicHolidaysCalendars: { code: string; name: string }[];
  date: string;

  constructor(@Inject(MCIT_DIALOG_DATA) data: { calendars: Map<CalendarTypes, { code: string; name: string }[]>; date: string }, private dialogRef: McitDialogRef<DateDetailModalComponent>) {
    this.invoicingCalendars = data.calendars.get(CalendarTypes.INVOICING);
    this.publicHolidaysCalendars = data.calendars.get(CalendarTypes.PUBLIC_HOLIDAYS);
    this.date = data.date;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
