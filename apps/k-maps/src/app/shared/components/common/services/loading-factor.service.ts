import { EventEmitter, Injectable } from '@angular/core';

export type McitLoadingFactorFormatType = 'VINS' | 'LF';
export enum McitLoadingFactorEnum {
  VINS = 'VINS',
  LF = 'LF'
}
const DEFAULT_LOADING_FACTOR_FORMAT: McitLoadingFactorFormatType = 'VINS';

export interface McitDistanceLoadingFactorChangeEvent {
  loadingFactorFormat: McitLoadingFactorFormatType;
}

@Injectable({
  providedIn: 'root'
})
export class McitLoadingFactorService {
  private _currentLoadingFactorFormat: McitLoadingFactorFormatType = DEFAULT_LOADING_FACTOR_FORMAT;
  private _onLoadingFactorFormatChangeEvent: EventEmitter<McitDistanceLoadingFactorChangeEvent> = new EventEmitter<McitDistanceLoadingFactorChangeEvent>();

  static get defaultLoadingFactorFormat(): McitLoadingFactorFormatType {
    return DEFAULT_LOADING_FACTOR_FORMAT;
  }

  get currentLoadingFactorFormat(): McitLoadingFactorFormatType {
    return this._currentLoadingFactorFormat;
  }

  get onLoadingFactorFormatChangeEvent(): EventEmitter<McitDistanceLoadingFactorChangeEvent> {
    return this._onLoadingFactorFormatChangeEvent;
  }

  constructor() {}

  useLoadingFactorFormat(loadingFactorFormat: McitLoadingFactorFormatType): void {
    this._currentLoadingFactorFormat = loadingFactorFormat;

    this._onLoadingFactorFormatChangeEvent.emit({ loadingFactorFormat });
  }
}
