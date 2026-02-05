import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { DateTime, Info } from 'luxon';
import { createDateAsUTC, getLastOpenDayOfMonth, getSixFirstOpenDayOfMonth, toSimpleLocalDateString, valueOfMonth } from '../../../helpers/date.helper';
import { CalendarApiRoute, CalendarsService } from '../../../services/calendars.service';
import { ICalendar, ICalendarPeriod } from '../../../models/calendar.model';
import { TranslateService } from '@ngx-translate/core';
import { McitPopupService } from '../../../services/popup.service';

@Component({
  selector: 'mcit-period-detail-modal',
  templateUrl: './period-detail-modal.component.html',
  styleUrls: ['./period-detail-modal.component.scss']
})
export class PeriodDetailModalComponent implements OnInit, DoCheck {
  closingDateForm: UntypedFormGroup;
  minDate: Date;
  maxDate: Date;
  startAt: Date;
  date: DateTime;
  editable = false;
  currentMonth = true;
  MIN_DAY: number;
  MAX_DAY: number;
  TIME_LIMIT = 'T23:59:00';
  calendar: ICalendar;
  checkedDates = new Map<DateTime, { color: string }>();
  calendarClosing: ICalendarPeriod;
  apiRoute: CalendarApiRoute;

  valueFormClosingDate = {
    SALES_CLOSING_DATE: '_sales_closing_date',
    SALES_ACCRUALS_CLOSING_DATE: '_sales_accruals_closing_date',
    PURCHASE_CLOSING_DATE: '_purchase_closing_date',
    PURCHASE_ACCRUALS_CLOSING_DATE: '_purchase_accruals_closing_date'
  };

  constructor(
    private dialogRef: McitDialogRef<PeriodDetailModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private calendarsHttpService: CalendarsService,
    private translateService: TranslateService,
    private popupService: McitPopupService,
    @Inject(MCIT_DIALOG_DATA) data: any
  ) {
    this.date = data.date;
    this.calendar = data.calendar;
    this.checkedDates = data.checkedDates;
    this.editable = data.editable;
    this.apiRoute = data.apiRoute;
    this.closingDateForm = this.formBuilder.group({
      _sales_closing_date: [null, Validators.required],
      _sales_accruals_closing_date: [null, Validators.required],
      _purchase_closing_date: [null, Validators.required],
      _purchase_accruals_closing_date: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.startAt = new Date(this.date.year, this.date.month - 1, this.date.day);
    this.MIN_DAY = this.getMinPeriodDate();
    this.MAX_DAY = this.getMaxPeriodDate();
    this.setMonth();
    this.minDate = new Date(this.date.year, this.date.month - 2, this.MIN_DAY);
    this.maxDate = new Date(this.date.year, this.date.month - 1, this.MAX_DAY);
    this.calendarClosing = this.getMonthPeriod();
    this.setForm();
  }

  private getMinPeriodDate(): number {
    const date =
      this.date.month === valueOfMonth.JANUARY
        ? DateTime.local(this.date.year - 1, valueOfMonth.DECEMBER, new Date(this.date.year - 1, valueOfMonth.DECEMBER, 0).getDate())
        : DateTime.local(this.date.year, this.date.month - 1, new Date(this.date.year, this.date.month - 1, 0).getDate());
    return getLastOpenDayOfMonth(date);
  }

  private getMaxPeriodDate(): number {
    const date = DateTime.local(this.date.year, this.date.month, 1);
    return getSixFirstOpenDayOfMonth(date);
  }

  ngDoCheck(): void {
    this.setInitialPeriodsHours(this.valueFormClosingDate.SALES_CLOSING_DATE);
    this.setInitialPeriodsHours(this.valueFormClosingDate.SALES_ACCRUALS_CLOSING_DATE);
    this.setInitialPeriodsHours(this.valueFormClosingDate.PURCHASE_CLOSING_DATE);
    this.setInitialPeriodsHours(this.valueFormClosingDate.PURCHASE_ACCRUALS_CLOSING_DATE);
  }

  private getMonthPeriod(): ICalendarPeriod {
    let periodTmp = null;
    const date = this.date.month - 1 === 0 ? DateTime.local(this.date.year - 1, valueOfMonth.DECEMBER, 1) : DateTime.local(this.date.year, this.date.month - 1, 1);
    const beginDateMonth = date.toString().slice(0, 8) + '01';
    this.calendar.periods.forEach((period) => {
      if (period?.related_closing_month?.date === beginDateMonth) {
        periodTmp = period;
      }
    });
    return periodTmp;
  }

  private setForm(): void {
    this.closingDateForm.get(this.valueFormClosingDate.SALES_CLOSING_DATE).setValue(this.calendarClosing?.sales_closing_date?.date);
    this.closingDateForm.get(this.valueFormClosingDate.SALES_ACCRUALS_CLOSING_DATE).setValue(this.calendarClosing?.sales_accruals_closing_date?.date);
    this.closingDateForm.get(this.valueFormClosingDate.PURCHASE_CLOSING_DATE).setValue(this.calendarClosing?.purchase_closing_date?.date);
    this.closingDateForm.get(this.valueFormClosingDate.PURCHASE_ACCRUALS_CLOSING_DATE).setValue(this.calendarClosing?.purchase_accruals_closing_date?.date);
  }

  private setInitialPeriodsHours(nameForm: string): void {
    if (this.closingDateForm.get(nameForm).value && !this.closingDateForm.get(nameForm).value.includes('T')) {
      this.closingDateForm.get(nameForm).setValue(this.closingDateForm.get(nameForm).value + this.TIME_LIMIT);
    }
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doSubmit(): void {
    const periods = this.setPeriods();
    const dateTmp = new Date(this.date.year, this.date.month - 2);
    const hasClosingMonthOnCurrentDate = this.calendar.periods.some((period) => period.related_closing_month?.date === toSimpleLocalDateString(dateTmp));
    this.calendarsHttpService.addOrRemoveAccountingPeriod(this.calendar._id, periods, !hasClosingMonthOnCurrentDate, this.apiRoute).subscribe(
      (next) => {
        this.calendar = next;
        this.popupService.showSuccess('CALENDARS.PERIOD_DETAIL_MODEL.SUCCESS', {
          titleKey: 'COMMON.CLEAR'
        });
      },
      () => {
        this.popupService.showError();
      },
      () => {
        this.dialogRef.close(this.calendar);
      }
    );
  }

  private setPeriods(): ICalendarPeriod {
    return {
      related_closing_month: {
        date: toSimpleLocalDateString(new Date(this.date.year, this.date.month - 2))
      },
      sales_closing_date: {
        date: this.closingDateForm?.get('_sales_closing_date')?.value ? new Date(this.closingDateForm?.get('_sales_closing_date')?.value)?.toISOString() : null
      },
      sales_accruals_closing_date: {
        date: this.closingDateForm?.get('_sales_accruals_closing_date')?.value ? new Date(this.closingDateForm?.get('_sales_accruals_closing_date')?.value).toISOString() : null
      },
      purchase_closing_date: {
        date: this.closingDateForm?.get('_purchase_closing_date')?.value ? new Date(this.closingDateForm?.get('_purchase_closing_date')?.value).toISOString() : null
      },
      purchase_accruals_closing_date: {
        date: this.closingDateForm?.get('_purchase_accruals_closing_date')?.value ? new Date(this.closingDateForm?.get('_purchase_accruals_closing_date')?.value).toISOString() : null
      }
    };
  }

  private setMonth(): void {
    if (this.date.day > this.MAX_DAY) {
      this.currentMonth = false;
      this.date = this.date.plus({ month: 1 });
      this.MIN_DAY = this.getMinPeriodDate();
      this.MAX_DAY = this.getMaxPeriodDate();
    }
  }

  setTitle(): string {
    const month = Info.months('long', { locale: this.translateService.currentLang })[this.date.month - 2 === -1 ? 11 : this.date.month - 2];
    const year = this.date.month - 2 === -1 ? this.date.year - 1 : this.date.year;
    return this.translateService.instant('CALENDARS.PERIOD_DETAIL_MODEL.TITLE_MONTH', { date: month }) + ` ${year}`;
  }
}
