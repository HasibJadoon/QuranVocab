import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DateTime, Info, WeekdayNumbers } from 'luxon';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { UntypedFormBuilder } from '@angular/forms';
import { ModifyDateModalService } from '../calendars/modify-date-derogatory-modal/modify-date-modal.service';
import { CalendarTypes, ICalendar } from '../models/calendar.model';
import { getLastOpenDayOfMonth, getSixFirstOpenDayOfMonth, valueOfDay } from '../helpers/date.helper';

@Component({
  selector: 'mcit-month-calendar',
  templateUrl: './month-calendar.component.html',
  styleUrls: ['./month-calendar.component.scss']
})
export class McitMonthCalendarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() month: number;
  @Input() year: number;
  @Input() checkedDates: Map<
    number,
    {
      color: string;
      closing_period?: string;
      derogatory_date?: Date;
      periodDates?: Array<{ date: string; type: string }>;
    }
  >;
  @Input() selectedCalendar: ICalendar;
  @Input() displayDerogatory = false;
  @Output() selectDateEvent = new EventEmitter<DateTime>();
  @Output() setDerogatoryDate = new EventEmitter<{ date: Date; derogatoryDate: Date }>();

  INVOICING_BACKGROUND = 'lightgreen';
  PERIODS_BACKGROUND = 'lightsalmon';
  readableMonth: string;
  readableDays: string[];
  weeks: Map<
    number,
    Array<{
      date: number;
      background: string;
      selected: boolean;
      closing_period?: string;
      derogatory_date?: Date;
      isWeekEnd: boolean;
      periodDates?: Array<{ date: string; type: string }>;
    }>
  >;
  onSelectDay = false;
  addDerogatory = false;
  submitAttempt = false;
  MIN_DAY: number;
  MAX_DAY: number;
  TIME_LIMIT = '23:59';

  private refreshSubject: Subject<boolean> = new Subject<boolean>();
  private subscriptions: Subscription[] = [];

  constructor(private translateService: TranslateService, private formBuilder: UntypedFormBuilder, private modifyDateModalService: ModifyDateModalService) {
    this.readableDays = Info.weekdays('short', { locale: this.translateService.currentLang });
  }

  ngOnInit(): void {
    if (this.year) {
      this.year = Number(this.year);
    }
    this.subscriptions.push(
      this.refreshSubject.asObservable().subscribe((next) => {
        this.initializeCalendar();
      })
    );
    this.refreshSubject.next(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.year && !changes.year.firstChange) {
      this.year = Number(changes.year.currentValue);
    }
    this.refreshSubject.next(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private initializeCalendar(): void {
    this.MIN_DAY = this.setEndPeriodDate();
    this.MAX_DAY = this.setMinPeriodDate();
    this.weeks = new Map<
      number,
      Array<{
        date: number;
        background: string;
        closing_period?: string;
        selected: boolean;
        derogatory_date?: Date;
        isWeekEnd: boolean;
        periodDates?: Array<{ date: string; type: string }>;
      }>
    >();
    this.readableMonth = Info.months('long', { locale: this.translateService.currentLang })[this.month - 1];
    const daysInMonth = DateTime.local(this.year, this.month).daysInMonth;
    for (let i = 1; i <= daysInMonth; i++) {
      const weekNumber = DateTime.local(this.year, this.month, i).weekNumber;
      const background = this.checkedDates && this.checkedDates.has(i) ? this.checkedDates.get(i).color : '';
      const derogatoryDate = this.checkedDates && this.checkedDates.has(i) ? this.checkedDates.get(i).derogatory_date : null;
      const periodDates = this.checkedDates && this.checkedDates.has(i) ? this.checkedDates.get(i).periodDates : null;
      const closingPeriod = this.checkedDates && this.checkedDates.has(i) ? this.checkedDates.get(i).closing_period : null;
      const isWeekEnd = this.isWeekEnd(i);
      if (!this.weeks.has(weekNumber)) {
        this.weeks.set(weekNumber, [
          {
            date: i,
            background,
            closing_period: closingPeriod,
            selected: false,
            derogatory_date: derogatoryDate,
            periodDates,
            isWeekEnd
          }
        ]);
      } else {
        this.weeks.get(weekNumber).push({
          date: i,
          background,
          closing_period: closingPeriod,
          selected: false,
          derogatory_date: derogatoryDate,
          periodDates,
          isWeekEnd
        });
      }
    }
    this.fillMonth();
  }

  private fillMonth(): void {
    const firstWeek = this.weeks.values().next().value as Array<{
      date: number;
      background: string;
      selected: boolean;
      derogatory_date?: Date;
      isWeekEnd: boolean;
      periodDates?: Array<{ date: string; type: string }>;
    }>;
    if (firstWeek.length < valueOfDay.SUNDAY) {
      do {
        firstWeek.unshift({ date: 0, background: '', selected: false, derogatory_date: null, isWeekEnd: false });
      } while (firstWeek.length < valueOfDay.SUNDAY);
    }
    const lastWeek = Array.from(this.weeks.values()).pop();
    if (lastWeek.length < valueOfDay.SUNDAY) {
      do {
        lastWeek.push({ date: 0, background: '', selected: false, derogatory_date: null, isWeekEnd: false });
      } while (lastWeek.length < valueOfDay.SUNDAY);
    }
  }

  isWeekEnd(day: number): boolean {
    let selectedCountry = 'FR';
    if (this.selectedCalendar?.type === CalendarTypes.PUBLIC_HOLIDAYS) {
      selectedCountry = this.selectedCalendar.country.code || selectedCountry;
    }

    // Little trick to get locale code from country code
    const locale = new Intl.Locale('und', { region: selectedCountry }).minimize().baseName;

    return Info.getWeekendWeekdays({ locale }).includes(DateTime.local(this.year, this.month, day).weekday as WeekdayNumbers);
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

  doSelectDate(day: number): void {
    if (!this.addDerogatory) {
      if (day) {
        this.selectDateEvent.emit(DateTime.utc(this.year, this.month, day));
      }
    }
    this.addDerogatory = false;
  }

  private setDerogatory(date, derogatoryDate: Date): void {
    this.submitAttempt = true;
    this.addDerogatory = true;
    const newDate = new Date(this.year, this.month - 1, date);
    this.modifyDateModalService.setDerogatoryDate(newDate, derogatoryDate, this.selectedCalendar).subscribe((next: any) => {
      this.refreshSubject.next(true);
      this.checkedDates.set(date, { color: this.INVOICING_BACKGROUND, derogatory_date: next });
      this.initializeCalendar();
      this.setDerogatoryDate.emit({ date: newDate, derogatoryDate: next });
    });
  }

  openCalendar(): void {
    this.addDerogatory = true;
  }

  getClassPeriod(type: string): string {
    switch (type) {
      case 'S':
        return 'topLeft';
      case 'SA':
        return 'topRight';
      case 'P':
        return 'botLeft';
      case 'PA':
        return 'botRight';
    }
  }

  private setEndPeriodDate(): number {
    const date = DateTime.local(this.year, this.month, new Date(this.year, this.month, 0).getDate());
    return getLastOpenDayOfMonth(date);
  }

  private setMinPeriodDate(): number {
    const date = DateTime.local(this.year, this.month, 1);
    return getSixFirstOpenDayOfMonth(date);
  }

  isDateForClosing(day: number): boolean {
    if (this.selectedCalendar?.type === CalendarTypes.PERIODS) {
      if (day <= this.MAX_DAY) {
        return true;
      } else if (day >= this.MIN_DAY) {
        return true;
      }
    }
    return false;
  }

  getTextToolTip(period: any): string {
    const date = period.date.slice(11, 16) !== this.TIME_LIMIT ? period.date.slice(11, 13) + 'h' : '';
    switch (period.type) {
      case 'S':
        return this.translateService.instant('CALENDARS.PERIOD_DETAIL_MODEL.SALES.CLOSING_DATE') + ` ${date}`;
      case 'SA':
        return this.translateService.instant('CALENDARS.PERIOD_DETAIL_MODEL.SALES.ACCRUALS_CLOSING_DATE') + ` ${date}`;
      case 'P':
        return this.translateService.instant('CALENDARS.PERIOD_DETAIL_MODEL.PURCHASE.CLOSING_DATE') + ` ${date}`;
      case 'PA':
        return this.translateService.instant('CALENDARS.PERIOD_DETAIL_MODEL.PURCHASE.ACCRUALS_CLOSING_DATE') + ` ${date}`;
    }
  }
}
