import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { DateTime } from 'luxon';

import { ICalendar, CalendarTypes } from '../../models/calendar.model';

import { McitPopupService } from '../../services/popup.service';
import { CalendarApiRoute, CalendarsService } from '../../services/calendars.service';

import { INVOICING_BACKGROUND, PUBLIC_HOLIDAYS_BACKGROUND } from '../calendars-synthesis-view/calendars-synthesis-view.component';
import { toISODate, toSimpleLocalDateString } from '../../helpers/date.helper';

@Component({
  selector: 'mcit-editable-calendars-view',
  templateUrl: './editable-calendars-view.component.html',
  styleUrls: ['./editable-calendars-view.component.scss']
})
export class EditableCalendarsViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedCalendar: ICalendar;
  @Input() type: CalendarTypes;
  @Input() editable: boolean;
  @Input() year: number;
  @Input() apiRoute: CalendarApiRoute;
  @Output() yearOutput = new EventEmitter<number>();
  @Output() editionEventOutput = new EventEmitter<boolean>();

  editedCalendar: ICalendar = null;

  checkedDates = new Map<DateTime, { color: string; derogatory_date: Date }>();
  background: string;
  private TIME_ZERO = '00:00:00.000Z';

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.type) {
      this.background = this.type === CalendarTypes.INVOICING ? INVOICING_BACKGROUND : PUBLIC_HOLIDAYS_BACKGROUND;
    }
    if (changes.selectedCalendar && this.selectedCalendar) {
      this.initCheckedDates();
    }
  }

  doSelectDate(date: DateTime): void {
    if (this.editable) {
      const stringDate = date.toUTC().toString();
      const index = this.selectedCalendar.dates.findIndex((removeDate) => removeDate.date.utc_date === stringDate);
      if (index < 0) {
        this.selectedCalendar.dates.push({
          date: {
            date: date.toString().slice(0, 10),
            utc_date: date.toUTC().toString()
          }
        });
      } else {
        this.selectedCalendar.dates.splice(index, 1);
      }
      this.editionEventOutput.emit(true);
      this.initCheckedDates();
    }
  }

  private initCheckedDates(): void {
    this.checkedDates = new Map<DateTime, { color: string; derogatory_date: Date }>();
    const dates = [];
    this.selectedCalendar.dates.forEach((date) => {
      if (date?.derogatory_billing_date) {
        dates.push({
          date: date?.date?.date,
          derogatory_billing_date: date?.derogatory_billing_date?.date
        });
      } else {
        dates.push({
          date: date?.date?.date
        });
      }
    });
    if (dates && dates.length > 0) {
      const dateTimes = dates.map((date) => [DateTime.fromISO(date.date, { zone: 'utc' }), date.derogatory_billing_date]);
      for (const date of dateTimes) {
        if (!this.checkedDates.has(date[0])) {
          this.checkedDates.set(date[0], {
            color: this.background,
            derogatory_date: date[1] ? new Date(date[1]) : null
          });
        }
      }
    }
  }

  setDerogatoryDate($event: { date: Date; derogatoryDate?: Date }): void {
    if (this.editable) {
      this.selectedCalendar.dates.forEach((date, index) => {
        if (date.date.date === toSimpleLocalDateString($event.date) && $event.derogatoryDate) {
          this.selectedCalendar.dates[index] = {
            date: date.date,
            derogatory_billing_date: {
              date: toISODate($event.derogatoryDate, this.TIME_ZERO).slice(0, 10),
              utc_date: toISODate($event.derogatoryDate, this.TIME_ZERO)
            }
          };
        }
      });
      this.editionEventOutput.emit(true);
    }
  }

  setYear(year: number): void {
    this.yearOutput.emit(year);
  }
}
