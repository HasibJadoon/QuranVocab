import { DateTime } from 'luxon';
import * as lodash from 'lodash';

const toUTCStringOffset = function (offset: number): string {
  if (offset) {
    if (offset > 0) {
      return 'UTC+' + offset / 60;
    } else if (offset < 0) {
      return 'UTC' + offset / 60;
    } else {
      return 'utc';
    }
  } else {
    return 'utc';
  }
};

export const valueOfDay = {
  SATURDAY: 6,
  SUNDAY: 7
};

export const valueOfMonth = {
  JANUARY: 1,
  DECEMBER: 12
};

export const toSimpleLocalDateString = function (date: Date): string {
  const result = [date.getFullYear(), ('0' + (date.getMonth() + 1)).slice(-2), ('0' + date.getDate()).slice(-2)].join('-');
  return result;
};

export function toLocalDateAtMidnight(selectedLocalDate: Date, minutesTimezoneOffset: number): Date {
  const dateToParse = toSimpleLocalDateString(selectedLocalDate);
  const luxon: DateTime = DateTime.fromISO(dateToParse, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon.toJSDate();
}

export function toLocalDate(isoString: string, minutesTimezoneOffset: number): Date {
  const luxon: DateTime = DateTime.fromISO(isoString, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon.toJSDate();
}

export function getLocalDateTime(date: Date, minutesTimezoneOffset: number): DateTime {
  const luxon: DateTime = DateTime.fromJSDate(date, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon;
}

export function getLocalDay(dateTime: Date, minutesTimezoneOffset: number): number {
  const luxon: DateTime = DateTime.fromJSDate(dateTime, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon.day;
}

export function getLocalMonth(dateTime: Date, minutesTimezoneOffset: number): number {
  const luxon: DateTime = DateTime.fromJSDate(dateTime, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon.month;
}

export function getLocalYear(dateTime: Date, minutesTimezoneOffset: number): number {
  const luxon: DateTime = DateTime.fromJSDate(dateTime, { zone: toUTCStringOffset(minutesTimezoneOffset) });
  return luxon.year;
}

export function timezoneForDatePipe(minutesTimezoneOffset: number): string {
  const minus = minutesTimezoneOffset < 0;
  const absMinutes = Math.abs(minutesTimezoneOffset);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes - hours * 60;
  return (minus ? '-' : '+') + ('0' + hours).slice(-2) + ('0' + minutes).slice(-2);
}

export function addWorkingDays(date: DateTime | Date, days: number): DateTime | Date {
  let isJsDate = false;

  if (date instanceof Date) {
    date = DateTime.fromJSDate(new Date(date));
    isJsDate = true;
  }

  if (days === 0) {
    return date;
  }
  const absdays = Math.abs(days);
  let tempDate = date;
  for (let i = 0; i < absdays; i++) {
    if (days < 0) {
      tempDate = tempDate.minus({ days: 1 });
      while (!isWorkingDay(tempDate)) {
        tempDate = tempDate.minus({ days: 1 });
      }
    } else {
      tempDate = tempDate.plus({ days: 1 });
      while (!isWorkingDay(tempDate)) {
        tempDate = tempDate.plus({ days: 1 });
      }
    }
  }

  if (isJsDate && tempDate instanceof DateTime) {
    return tempDate.toJSDate();
  }
  return tempDate;
}

export function isWorkingDay(date: DateTime): boolean {
  return date.weekday < 6; // lundi au vendredi
}

/**
 * Convertie une date et des horaires (HH:mm)
 */
export function toISODate(date: Date, time: string): string {
  if (!date) {
    return null;
  }

  const dateString = `${lodash.padStart(date.getFullYear().toString(), 4, '0')}-${lodash.padStart((date.getMonth() + 1).toString(), 2, '0')}-${lodash.padStart(date.getDate().toString(), 2, '0')}`;
  return time ? `${dateString}T${time}` : dateString;
}

export function getDatesForMode(mode: string, includeMin: boolean = true, includeMax: boolean = false): { min: Date; max: Date } {
  let min: DateTime;
  let max: DateTime;
  switch (mode) {
    case 'today':
      {
        const today = DateTime.local();
        min = includeMin ? today : today.minus({ day: 1 });
        max = includeMax ? today : today.plus({ day: 1 });
      }
      break;
    case 'todayBefore':
      {
        max = includeMax ? DateTime.local() : DateTime.local().plus({ day: 1 });
      }
      break;
    case 'todayAfter':
      {
        min = includeMin ? DateTime.local() : DateTime.local().minus({ day: 1 });
      }
      break;
    case 'todayYesterday':
      {
        min = includeMin ? DateTime.local().minus({ day: 1 }) : DateTime.local().minus({ day: 2 });
        max = includeMax ? DateTime.local() : DateTime.local().plus({ day: 1 });
      }
      break;
    case 'yesterday':
      {
        const yesterday = DateTime.local().minus({ day: 1 });
        min = includeMin ? yesterday : yesterday.minus({ day: 1 });
        max = includeMax ? yesterday : yesterday.plus({ day: 1 });
      }
      break;
    case 'yesterdayBefore':
      {
        max = DateTime.local().minus({ day: includeMax ? 1 : 0 });
      }
      break;
    case 'tomorrow':
      {
        const tomorrow = DateTime.local().plus({ day: 1 });
        min = includeMin ? tomorrow : tomorrow.minus({ day: 1 });
        max = includeMax ? tomorrow : tomorrow.plus({ day: 1 });
      }
      break;
    case 'tomorrowAfter':
      {
        min = DateTime.local().plus({ day: includeMin ? 1 : 0 });
      }
      break;
    case 'currentWeek':
      {
        min = DateTime.local()
          .startOf('week')
          .minus({ day: includeMin ? 0 : 1 });
        max = DateTime.local()
          .endOf('week')
          .plus({ day: includeMax ? 0 : 1 });
      }
      break;
    case 'currentMonth':
      {
        min = DateTime.local()
          .startOf('month')
          .minus({ day: includeMin ? 0 : 1 });
        max = DateTime.local()
          .endOf('month')
          .plus({ day: includeMax ? 0 : 1 });
      }
      break;
    case 'lastWeek':
      {
        min = DateTime.local()
          .startOf('week')
          .minus({ day: includeMin ? 7 : 8 });
        max = DateTime.local()
          .endOf('week')
          .minus({ day: includeMax ? 7 : 6 });
      }
      break;
    case 'lastMonth':
      {
        min = DateTime.local()
          .startOf('month')
          .minus({ month: 1, day: includeMin ? 0 : 1 });
        max = DateTime.local()
          .startOf('month')
          .minus({ month: 1 })
          .endOf('month')
          .plus({ day: includeMax ? 0 : 1 });
      }
      break;
    case 'lastCurrentMonth':
      {
        min = DateTime.local()
          .startOf('month')
          .minus({ month: 1, day: includeMin ? 0 : 1 });
        max = DateTime.local()
          .endOf('month')
          .plus({ day: includeMax ? 0 : 1 });
      }
      break;
  }
  return {
    min: min ? min.startOf('day').toJSDate() : null,
    max: max ? max.endOf('day').toJSDate() : null
  };
}

export function secondsToHm(d: any): string {
  let minus = false;
  d = Number(d);
  if (d < 0) {
    minus = true;
    d = Math.trunc(d);
  }
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);

  const hDisplay = h > 0 ? h + 'h' : '';
  const mDisplay = h > 0 ? lodash.padStart(m.toString(), 2, '0') : m > 0 ? m + 'm' : '';
  if ((hDisplay + mDisplay).length > 0) {
    return (minus ? '-' : '') + (hDisplay + mDisplay);
  } else {
    return '0m';
  }
}

export function getNumberDayInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function createDateAsUTC(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

export function getMonthsDiffBetweenTwoDates(startDate: string, endDate: string): number {
  const startDateTime = DateTime.fromISO(startDate);
  const endDateTime = DateTime.fromISO(endDate);
  return endDateTime?.diff(startDateTime, ['months'])?.toObject()?.months;
}

export function getDaysDuration(startDate: Date, endDate: Date, isLastDayIncluded: boolean = false): number {
  startDate.setUTCHours(0, 0, 0, 0);
  const startDateTime = DateTime.fromJSDate(startDate);
  endDate.setUTCHours(0, 0, 0, 0);
  const endDateTime = DateTime.fromJSDate(endDate);
  let duration = endDateTime?.diff(startDateTime, ['days'])?.toObject()?.days;
  return isLastDayIncluded ? ++duration : duration;
}

export function getLastOpenDayOfMonth(date: DateTime): number {
  switch (date.weekday) {
    case valueOfDay.SATURDAY:
      return date.day - 1;
    case valueOfDay.SUNDAY:
      return date.day - 2;
    default:
      return date.day;
  }
}

export function getSixFirstOpenDayOfMonth(date: DateTime): number {
  switch (date.weekday) {
    case valueOfDay.SATURDAY:
      return date.day + 9;
    case valueOfDay.SUNDAY:
      return date.day + 8;
    default:
      return date.day + 7;
  }
}

export function isSameDay(date: DateTime, date2: DateTime = DateTime.now()): boolean {
  return date.startOf('day').equals(date2.startOf('day'));
}

export function isPreviousDay(date: DateTime): boolean {
  return date.startOf('day').equals(DateTime.now().plus({ days: -1 }).startOf('day'));
}
