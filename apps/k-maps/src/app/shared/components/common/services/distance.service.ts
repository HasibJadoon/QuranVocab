import { EventEmitter, Injectable } from '@angular/core';

export type McitDistanceFormatType = 'KM' | 'MI';

const DEFAULT_DISTANCE_FORMAT: McitDistanceFormatType = 'KM';
const KM_TO_MI = 0.62137119;

export interface McitDistanceFormatChangeEvent {
  distanceFormat: McitDistanceFormatType;
}

@Injectable({
  providedIn: 'root'
})
export class McitDistanceService {
  private _currentDistanceFormat: McitDistanceFormatType = DEFAULT_DISTANCE_FORMAT;
  private _onDistanceFormatChangeEvent: EventEmitter<McitDistanceFormatChangeEvent> = new EventEmitter<McitDistanceFormatChangeEvent>();

  get defaultDistanceFormat(): McitDistanceFormatType {
    return DEFAULT_DISTANCE_FORMAT;
  }

  get currentDistanceFormat(): McitDistanceFormatType {
    return this._currentDistanceFormat;
  }

  get onDistanceFormatChangeEvent(): EventEmitter<McitDistanceFormatChangeEvent> {
    return this._onDistanceFormatChangeEvent;
  }

  constructor() {}

  useDistanceFormat(distanceFormat: McitDistanceFormatType): void {
    this._currentDistanceFormat = distanceFormat;

    this._onDistanceFormatChangeEvent.emit({ distanceFormat });
  }

  getDistance(value: number): string {
    if (!value && value !== 0) {
      return '';
    }
    if (this._currentDistanceFormat === 'KM') {
      return Math.round(value / 100) / 10 + ' km';
    }
    return Math.round((value * KM_TO_MI) / 100) / 10 + ' mi';
  }

  toKm(value: number): number {
    if (value == null) {
      return value;
    }
    if (this._currentDistanceFormat === 'KM') {
      return value;
    }
    return value / KM_TO_MI;
  }
}
