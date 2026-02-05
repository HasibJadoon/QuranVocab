import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { DateTime } from 'luxon';

import { CalendarApiRoute, CalendarsService } from '../../services/calendars.service';
import { McitPopupService } from '../../services/popup.service';
import { McitWaitingService } from '../../services/waiting.service';
import { McitDialog } from '../../dialog/dialog.service';

import { ICalendar, CalendarTypes } from '../../models/calendar.model';

import { DateDetailModalComponent } from './date-detail-modal/date-detail-modal.component';

export const INVOICING_BACKGROUND = 'lightgreen';
export const PERIODS_BACKGROUND = 'lightsalmon';
export const PUBLIC_HOLIDAYS_BACKGROUND = 'repeating-linear-gradient(-45deg, transparent, transparent 3px, lightsalmon 3px, lightsalmon 6px)';
export const INVOICING_AND_PH_BACKGROUND = 'repeating-linear-gradient(-45deg, lightgreen, lightgreen 3px, lightsalmon 3px, lightsalmon 6px)';

@Component({
  selector: 'mcit-calendars-synthesis-view',
  templateUrl: './calendars-synthesis-view.component.html',
  styleUrls: ['./calendars-synthesis-view.component.scss']
})
export class CalendarsSynthesisViewComponent implements OnInit, OnDestroy {
  @Output() yearOutput = new EventEmitter<number>();
  @Input() year: number;
  @Input() apiRoute: CalendarApiRoute;

  calendars: ICalendar[];
  checkedDates = new Map<DateTime, { color: string; derogatory_date: Date }>();

  constructor(private calendarsHttpService: CalendarsService, private popupService: McitPopupService, private waitingService: McitWaitingService, private dialog: McitDialog) {}

  ngOnInit(): void {
    this.waitingService.showWaiting();
    this.calendarsHttpService.getAllByType(null, '', this.apiRoute).subscribe(
      (next) => {
        this.calendars = next;
        this.initCheckedDates();
        this.waitingService.hideWaiting();
      },
      (err) => this.popupService.showError()
    );
  }

  ngOnDestroy(): void {}

  doSelectDate(date: DateTime): void {
    const dateEvents = new Map<CalendarTypes, { code: string; name: string }[]>();
    dateEvents.set(CalendarTypes.INVOICING, []);
    dateEvents.set(CalendarTypes.PUBLIC_HOLIDAYS, []);
    const filteredCalendars = this.calendars.filter(
      (cal) =>
        cal.dates.filter((dateTo) => {
          if (dateTo?.date?.utc_date) {
            return dateTo.date.utc_date.includes(date.toISO());
          } else {
            return false;
          }
        }).length
    );
    filteredCalendars.forEach((cal) => {
      const calInfo = cal.type === CalendarTypes.INVOICING ? { code: cal.code, name: cal.name } : cal.country;
      dateEvents.get(cal.type).push(calInfo);
    });
    this.dialog.open(DateDetailModalComponent, {
      dialogClass: 'modal-md',
      data: {
        calendars: dateEvents,
        date: date.toLocaleString(DateTime.DATE_SHORT)
      }
    });
  }

  private initCheckedDates(): void {
    this.checkedDates = new Map<DateTime, { color: string; derogatory_date: Date }>();
    const dates = this.calendars.reduce((acc, val) => {
      for (const date of val.dates) {
        const background = val.type === CalendarTypes.INVOICING ? INVOICING_BACKGROUND : PUBLIC_HOLIDAYS_BACKGROUND;
        if (!acc.find((d) => d.date === date && d.background === INVOICING_AND_PH_BACKGROUND)) {
          if (acc.some((d) => d.date === date && background !== d.background)) {
            const index = acc.findIndex((d) => d.date === date);
            acc.splice(index, 1);
            acc.push({ date, background: INVOICING_AND_PH_BACKGROUND });
          } else {
            acc.push({ date, background });
          }
        }
      }
      return acc;
    }, []);
    if (dates && dates.length > 0) {
      for (const d of dates) {
        this.checkedDates.set(DateTime.fromISO(d.date.date.date, { zone: 'utc' }), {
          color: d.background,
          derogatory_date: null
        });
      }
    }
  }

  setYear(year: number): void {
    this.yearOutput.emit(year);
  }
}
