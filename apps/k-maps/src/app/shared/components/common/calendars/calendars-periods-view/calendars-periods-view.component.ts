import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarTypes, ICalendar, ICalendarPeriod } from '../../models/calendar.model';
import { CalendarApiRoute, CalendarsService } from '../../services/calendars.service';
import { McitPopupService } from '../../services/popup.service';
import { McitWaitingService } from '../../services/waiting.service';
import { McitDialog } from '../../dialog/dialog.service';
import { PERIODS_BACKGROUND } from '../calendars-synthesis-view/calendars-synthesis-view.component';
import { PeriodDetailModalComponent } from './period-detail-modal/period-detail-modal.component';
import { ILocalDate } from '../../models/types.model';
import { createDateAsUTC } from '../../helpers/date.helper';

@Component({
  selector: 'mcit-calendars-periods-view',
  templateUrl: './calendars-periods-view.component.html',
  styleUrls: ['./calendars-periods-view.component.scss']
})
export class CalendarsPeriodsViewComponent implements OnInit {
  @Input() editable: boolean;
  @Input() selectedCalendar: ICalendar;
  @Input() year: number;
  @Input() apiRoute: CalendarApiRoute;
  @Output() yearOutput = new EventEmitter<number>();

  calendars: ICalendar[];
  checkedDates = new Map<DateTime, { color: string; periodDates: Array<{ date: string; type: string }> }>();

  constructor(private calendarsHttpService: CalendarsService, private popupService: McitPopupService, private waitingService: McitWaitingService, private dialog: McitDialog) {}

  ngOnInit(): void {
    this.waitingService.showWaiting();
    this.calendarsHttpService.getAllByType(CalendarTypes.PERIODS, '', this.apiRoute).subscribe(
      (next) => {
        this.calendars = next;
        this.initCheckedDates();
        this.waitingService.hideWaiting();
      },
      () => this.popupService.showError()
    );
  }

  private setLocalDateCalendars(): void {
    this.calendars[0].periods = this.calendars[0].periods.map((period) => ({
      related_closing_month: {
        date: period.related_closing_month.date,
        utc_date: period.related_closing_month.utc_date
      },
      sales_closing_date: {
        date: period.sales_closing_date.date ? createDateAsUTC(new Date(period.sales_closing_date.date)).toISOString().substr(0, 19) : null,
        utc_date: period.sales_closing_date.utc_date
      },
      sales_accruals_closing_date: {
        date: period.sales_accruals_closing_date.date ? createDateAsUTC(new Date(period.sales_accruals_closing_date.date)).toISOString().substr(0, 19) : null,
        utc_date: period.sales_accruals_closing_date.utc_date
      },
      purchase_closing_date: {
        date: period.purchase_closing_date.date ? createDateAsUTC(new Date(period.purchase_closing_date.date)).toISOString().substr(0, 19) : null,
        utc_date: period.purchase_closing_date.utc_date
      },
      purchase_accruals_closing_date: {
        date: period.purchase_accruals_closing_date.date ? createDateAsUTC(new Date(period.purchase_accruals_closing_date.date)).toISOString().substr(0, 19) : null,
        utc_date: period.purchase_accruals_closing_date.utc_date
      }
    }));
  }

  doSelectDate(date: DateTime): void {
    this.dialog
      .open(PeriodDetailModalComponent, {
        dialogClass: 'modal-md',
        data: {
          calendar: this.calendars[0],
          date,
          checkedDates: this.checkedDates,
          editable: this.editable,
          apiRoute: this.apiRoute
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.calendars = [result];
          this.initCheckedDates();
        }
      });
  }

  private setMapPeriod(mapPeriod: Map<string, Array<{ date: string; type: string }>>, periods: ILocalDate, type: string): void {
    const dateTmp = periods?.date ? periods?.date.slice(0, 10) : null;
    if (dateTmp) {
      if (mapPeriod.has(dateTmp)) {
        const values = mapPeriod.get(dateTmp);
        values.push({ date: periods?.date, type });
        mapPeriod.set(dateTmp, values);
      } else {
        mapPeriod.set(dateTmp, [{ date: periods?.date, type }]);
      }
    }
  }

  private checkSameDate(period: ICalendarPeriod): void {
    const periodMapTmp = new Map<string, Array<{ date: string; type: string }>>();
    const dateTmp = period?.sales_closing_date?.date ? period?.sales_closing_date?.date.slice(0, 10) : null;
    if (dateTmp) {
      periodMapTmp.set(dateTmp, [{ date: period?.sales_closing_date?.date, type: 'S' }]);
    }
    this.setMapPeriod(periodMapTmp, period?.sales_accruals_closing_date, 'SA');
    this.setMapPeriod(periodMapTmp, period?.purchase_closing_date, 'P');
    this.setMapPeriod(periodMapTmp, period?.purchase_accruals_closing_date, 'PA');
    periodMapTmp.forEach((value, key) => {
      this.checkedDates.set(DateTime.fromISO(key, { zone: 'utc' }), { color: PERIODS_BACKGROUND, periodDates: value });
    });
  }

  private initCheckedDates(): void {
    this.setLocalDateCalendars();
    this.checkedDates = new Map<DateTime, { color: string; periodDates: Array<{ date: string; type: string }> }>();
    this.calendars.forEach((calendar) => {
      calendar.periods.forEach((date) => {
        this.checkSameDate(date);
      });
    });
  }

  doSetYear(year: number): void {
    this.yearOutput.emit(year);
  }
}
