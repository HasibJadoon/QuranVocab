import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { DateTime } from 'luxon';
import { ICalendar } from '../models/calendar.model';

@Component({
  selector: 'mcit-year-calendar',
  templateUrl: './year-calendar.component.html',
  styleUrls: ['./year-calendar.component.scss']
})
export class McitYearCalendarComponent implements OnInit, OnChanges {
  @Input() dates: Map<DateTime, { color: string; derogatory_date?: Date; periodDates?: Array<{ date: string; type: string }> }>;
  @Input() selectedCalendar: ICalendar;
  @Input() displayDerogatory = false;
  @Input() year: number;
  @Output() selectDateEvent = new EventEmitter<DateTime>();
  @Output() setDerogatoryDate = new EventEmitter<{ date: Date; derogatoryDate?: Date }>();
  @Output() yearOutput = new EventEmitter<number>();

  selectedYear = new Date().getFullYear();
  monthDates: Array<Map<number, { color: string; derogatory_date?: Date; periodDates?: Array<{ date: string; type: string }> }>>;
  MONTH_IN_YEAR = 12;

  constructor() {}

  ngOnInit(): void {
    this.selectedYear = this.year ?? this.selectedYear;
    this.initMonthDates();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dates) {
      this.initMonthDates();
    }
  }

  doSelectDate(date: DateTime): void {
    this.selectDateEvent.emit(date);
  }

  setDerogatory($event: { date: Date; derogatoryDate: Date }): void {
    this.setDerogatoryDate.emit($event);
  }

  doPrev(): void {
    this.selectedYear--;
    this.initMonthDates();
    this.yearOutput.emit(this.selectedYear);
  }

  doNext(): void {
    this.selectedYear++;
    this.initMonthDates();
    this.yearOutput.emit(this.selectedYear);
  }

  private initMonthDates(): void {
    this.monthDates = new Array<Map<number, { color: string; derogatory_date?: Date; periodDates: Array<{ date: string; type: string }> }>>(this.MONTH_IN_YEAR);
    this.dates.forEach((value, key, map) => {
      if (key.year.toString() === this.selectedYear.toString()) {
        if (!this.monthDates[key.month]) {
          this.monthDates[key.month] = new Map<number, { color: string; derogatory_date?: Date; periodDates: Array<{ date: string; type: string }> }>();
        }
        this.monthDates[key.month].set(key.day, {
          color: value.color,
          derogatory_date: value.derogatory_date,
          periodDates: value.periodDates
        });
      }
    });
  }
}
