import { EventEmitter, Injectable } from '@angular/core';

export type DateFormatType = 'DD_MM_YYYY' | 'MM_DD_YYYY';
export type TimeFormatType = '24H' | '12H';

const DEFAULT_DATE_FORMAT: DateFormatType = 'DD_MM_YYYY';
const DEFAULT_TIME_FORMAT: TimeFormatType = '24H';

export interface McitDateFormatChangeEvent {
  dateFormat: DateFormatType;
}

export interface McitTimeFormatChangeEvent {
  timeFormat: TimeFormatType;
}

@Injectable({
  providedIn: 'root'
})
export class McitDateTimeService {
  private _currentDateFormat: DateFormatType = DEFAULT_DATE_FORMAT;
  private _onDateFormatChangeEvent: EventEmitter<McitDateFormatChangeEvent> = new EventEmitter<McitDateFormatChangeEvent>();

  private _currentTimeFormat: TimeFormatType = DEFAULT_TIME_FORMAT;
  private _onTimeFormatChangeEvent: EventEmitter<McitTimeFormatChangeEvent> = new EventEmitter<McitTimeFormatChangeEvent>();

  static get defaultDateFormat(): DateFormatType {
    return DEFAULT_DATE_FORMAT;
  }

  get currentDateFormat(): DateFormatType {
    return this._currentDateFormat;
  }

  get onDateFormatChangeEvent(): EventEmitter<McitDateFormatChangeEvent> {
    return this._onDateFormatChangeEvent;
  }

  static get defaultTimeFormat(): TimeFormatType {
    return DEFAULT_TIME_FORMAT;
  }

  get currentTimeFormat(): TimeFormatType {
    return this._currentTimeFormat;
  }

  get onTimeFormatChangeEvent(): EventEmitter<McitTimeFormatChangeEvent> {
    return this._onTimeFormatChangeEvent;
  }

  constructor() {}

  useDateFormat(dateFormat: DateFormatType): void {
    this._currentDateFormat = dateFormat;
    this._onDateFormatChangeEvent.emit({ dateFormat });
  }

  useTimeFormat(timeFormat: TimeFormatType): void {
    this._currentTimeFormat = timeFormat;
    this._onTimeFormatChangeEvent.emit({ timeFormat });
  }
}
