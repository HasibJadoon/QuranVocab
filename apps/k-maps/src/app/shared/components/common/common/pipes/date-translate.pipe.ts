import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { DateFormatType, McitDateFormatChangeEvent, McitDateTimeService, McitTimeFormatChangeEvent, TimeFormatType } from '../../services/date-time.service';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import * as lodash from 'lodash';

@Pipe({
  name: 'dateTranslate',
  pure: false
})
export class McitDateTranslatePipe implements PipeTransform, OnDestroy {
  constructor(private translateService: TranslateService, private dateTimeService: McitDateTimeService, private changeDectectorRef: ChangeDetectorRef) {
    this.datePipe = new DatePipe('en');
  }

  private value: string;

  private lastValue: string;
  private lastArgs: string;

  private datePipe: DatePipe;
  private onLangChange: Subscription;
  private onDateFormatChange: Subscription;
  private onTimeFormatChange: Subscription;

  private static buildFormat(format: string, dateFormat: DateFormatType, timeFormat: TimeFormatType): string {
    switch (format) {
      case 'day_month':
        return dateFormat === 'DD_MM_YYYY' ? 'dd/MM' : 'MM/dd';
      case 'day_month_long':
        return dateFormat === 'DD_MM_YYYY' ? 'dd MMMM' : 'MMMM dd';
      case 'date':
        return dateFormat === 'DD_MM_YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
      case 'date_time':
        return (dateFormat === 'DD_MM_YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy') + ' ' + (timeFormat === '24H' ? 'HH:mm' : 'hh:mm a');
      case 'day_month_time_tiret':
        return (dateFormat === 'DD_MM_YYYY' ? 'dd/MM' : 'MM/dd') + ' - ' + (timeFormat === '24H' ? 'HH:mm' : 'hh:mm a');
      case 'day_month_tiret':
        return dateFormat === 'DD_MM_YYYY' ? 'dd/MM' : 'MM/dd';
      case 'day_of_month':
        return 'dd';
      case 'day_of_week':
        return 'EEEE';
      case 'day_of_week_abbr1':
        return 'E';
      case 'day_of_week_abbr2':
        return 'EE';
      case 'day_of_week_abbr3':
        return 'EEE';
      case 'hour_day_month':
        return (timeFormat === '24H' ? 'HH:mm' : 'hh:mm a') + ' (' + (dateFormat === 'DD_MM_YYYY' ? 'dd/MM' : 'MM/dd') + ')';
      case 'hour_minutes':
        return timeFormat === '24H' ? 'HH:mm' : 'hh:mm a';
      case 'hour_minutes_seconds':
        return timeFormat === '24H' ? 'HH:mm:ss' : 'hh:mm:ss a';
      case 'hour':
        return timeFormat === '24H' ? 'HH' : 'hh a';
      case 'month_year':
        return 'MMMM yy';
      case 'date_time_seconds':
        return (dateFormat === 'DD_MM_YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy') + ' ' + (timeFormat === '24H' ? 'HH:mm:ss' : 'hh:mm:ss a');
      case 'date_time_seconds_milliseconds':
        return (dateFormat === 'DD_MM_YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy') + ' ' + (timeFormat === '24H' ? 'HH:mm:ss.SSS' : 'hh:mm:ss.SSS a');
    }
    return format;
  }

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: any, formatSpec: string, timezone?: string, doNotDisplayZeroTime?: boolean): any {
    if (!value || value.length === 0) {
      return value;
    }

    const jvalue = JSON.stringify(value);
    const jargs = JSON.stringify([formatSpec, timezone]);

    if (jvalue === this.lastValue && jargs === this.lastArgs) {
      return this.value;
    }

    let val;
    // compatibility with ILocalDate
    // The code below translates the LocalDate to the timezone of the viewer which must NOT be done.
    // LocalDates are functional date that must be seen "as-is", implicitely expressed in the timezone of
    // the location linked to the LocalDate (e.g. pickup site of a pickup date).
    /*if (value.utc_date) {
      val = new Date(value.utc_date);
    } else */
    if (value.date && typeof value.date === 'string') {
      // Bad display of dates without time
      // val = new Date(value.date);
      val = DateTime.fromISO(value.date).toJSDate();
    } else if (value instanceof DateTime) {
      val = value.toJSDate();
    } else if (value instanceof Date) {
      val = value;
    } else if (typeof value === 'string') {
      val = value;
    } else {
      return '';
    }

    const nFormat = this.returnFormaDate(val, formatSpec, doNotDisplayZeroTime);

    let format = McitDateTranslatePipe.buildFormat(nFormat, this.dateTimeService.currentDateFormat, this.dateTimeService.currentTimeFormat);

    this.lastValue = jvalue;
    this.lastArgs = jargs;

    this.updateValue(val, format, timezone, this.translateService.currentLang);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue(val, format, timezone, event.lang);
      });
    }

    if (!this.onDateFormatChange) {
      this.onDateFormatChange = this.dateTimeService.onDateFormatChangeEvent.subscribe((event: McitDateFormatChangeEvent) => {
        format = McitDateTranslatePipe.buildFormat(nFormat, event.dateFormat, this.dateTimeService.currentTimeFormat);
        this.updateValue(val, format, timezone, this.translateService.currentLang);
      });
    }

    if (!this.onTimeFormatChange) {
      this.onTimeFormatChange = this.dateTimeService.onTimeFormatChangeEvent.subscribe((event: McitTimeFormatChangeEvent) => {
        format = McitDateTranslatePipe.buildFormat(nFormat, this.dateTimeService.currentDateFormat, event.timeFormat);
        this.updateValue(val, format, timezone, this.translateService.currentLang);
      });
    }

    return this.value;
  }

  private updateValue(value: any, format: string, timezone: string, lang: string): void {
    try {
      this.value = this.datePipe.transform(value, format, timezone, lang);
    } catch (e) {
      console.error(e);
      this.value = value;
    }

    if (this.changeDectectorRef) {
      this.changeDectectorRef.markForCheck();
    }
  }

  private returnFormaDate(date: string | Date, format: string, doNotDisplayZeroTime?: boolean): string {
    const dateString = date instanceof Date ? DateTime.fromJSDate(date) : date;
    const splittedDate = lodash.cloneDeep(dateString).toString().split('T');
    const removeTime = splittedDate?.length === 1 || (doNotDisplayZeroTime && splittedDate?.length === 2 && splittedDate?.[1]?.startsWith('00:00'));
    if (format === 'date_time' && removeTime) {
      format = 'date';

      return format;
    } else if (format === 'day_month_time_tiret' && removeTime) {
      format = 'day_month_tiret';

      return format;
    }
    return format;
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }

    if (typeof this.onDateFormatChange !== 'undefined') {
      this.onDateFormatChange.unsubscribe();
      this.onDateFormatChange = undefined;
    }

    if (typeof this.onTimeFormatChange !== 'undefined') {
      this.onTimeFormatChange.unsubscribe();
      this.onTimeFormatChange = undefined;
    }
  }
}
