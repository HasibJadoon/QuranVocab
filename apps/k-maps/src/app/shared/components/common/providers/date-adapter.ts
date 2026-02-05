import { Inject, Injectable, Optional } from '@angular/core';
import { MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { McitDateTimeService } from '../services/date-time.service';
import { TranslateService } from '@ngx-translate/core';

export const MCIT_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' }
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};

@Injectable()
export class McitDateAdapter extends NativeDateAdapter {
  constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string, platform: Platform, private dateTimeService: McitDateTimeService, private translateService: TranslateService) {
    super(translateService.currentLang, platform);

    this.translateService.onLangChange.subscribe((next) => {
      this.setLocale(next.lang);
    });
  }

  format(date: Date, displayFormat: string | object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (this.dateTimeService.currentDateFormat === 'DD_MM_YYYY') {
        return this._to2digit(day) + '/' + this._to2digit(month) + '/' + year;
      }
      return this._to2digit(month) + '/' + this._to2digit(day) + '/' + year;
    } else {
      return super.format(date, displayFormat);
    }
  }

  parse(value: any): Date | null {
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        if (this.dateTimeService.currentDateFormat === 'DD_MM_YYYY') {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
          return new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
        }
      }
    }

    return super.parse(value);
  }

  private _to2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  /*
    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
      switch (style) {
        case 'long':
          return this.translateService.instant('CALENDAR.DAY_OF_WEEK.LONG');
        case 'short':
          return this.translateService.instant('CALENDAR.DAY_OF_WEEK.SHORT');
        case 'narrow':
          return this.translateService.instant('CALENDAR.DAY_OF_WEEK.NARROW');
      }
    }

    getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
      switch (style) {
        case 'long':
          return this.translateService.instant('CALENDAR.MONTH.LONG');
        case 'short':
          return this.translateService.instant('CALENDAR.MONTH.SHORT');
        case 'narrow':
          return this.translateService.instant('CALENDAR.MONTH.NARROW');
      }
    }*/

  getFirstDayOfWeek(): number {
    return this.translateService.instant('CALENDAR.FIRST_DAY_OF_WEEK');
  }
}
