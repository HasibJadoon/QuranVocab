import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { McitCheckVersionService } from '../../../check-version/check-version.service';
import { catchError, filter, takeUntil, tap } from 'rxjs/operators';
import { isEmpty } from 'lodash';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { SocketEventNames } from '@lib-shared/common/chat/business/domains/socket-event-name.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitSocketService implements OnDestroy {
  private _socket: Socket;
  private _urlSocket: string;
  private _eventsSubject: {
    [key in SocketEventNames]?: Subject<any>;
  } = {};

  private _events: {
    [key in SocketEventNames]?: Observable<any>;
  } = {};

  private _destroy$ = new Subject<boolean>();

  constructor(private checkVersionService: McitCheckVersionService) {
    Object.values(SocketEventNames).forEach((value) => {
      this._eventsSubject[value] = new Subject();
      this._events[value] = this._eventsSubject[value].asObservable().pipe(
        filter((b) => !!b),
        takeUntil(this._destroy$)
      );
    });

    this.checkVersionService
      .version$()
      .pipe(
        filter((version) => !!version),
        tap((version) => {
          this._urlSocket = this._getEnv(version.env);
          this._ensureConnection();
        }),
        catchError((err) => doCatch('checkVersion socket', err, null))
      )
      .subscribe();
  }

  /**
   * Get an Observable that matches an EventName
   * @param eventName
   */
  events$<T>(eventName: SocketEventNames): Observable<T> {
    return this._events[eventName] as Observable<T>;
  }

  /**
   * Emit data that matches an EventName
   * @param eventName
   * @param data
   */
  emit<T>(eventName: SocketEventNames, data?: T): void {
    this._ensureConnection();
    this._socket.emit(eventName, isEmpty(data) ? null : data);
  }

  ngOnDestroy(): void {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
    this._disconnect();
  }

  private _ensureConnection(): void {
    if (!this._socket?.active && this._urlSocket) {
      this._socket = io.connect(`${this._urlSocket}`, {
        transports: ['websocket', 'polling']
      });
      this._checkEvent();
    }
  }

  private _disconnect(): void {
    this._socket.disconnect();
  }

  private _checkEvent(): void {
    Object.values(SocketEventNames).forEach((value) => {
      this._socket.on(value, (data) => {
        // console.log(this._socket?.id, value, data);
        this._eventsSubject[value].next(data);
      });
    });
  }

  // TODO: Trouver une solution moins en Dur (pipelines, config, ...etc)
  private _getEnv(env: string): string {
    switch (env) {
      case 'dev':
        return 'https://api.dev.moveecar.io';
      case 'demo':
        return 'https://api.qal.moveecar.io';
      case 'test':
        return 'https://api.tst.moveecar.io';
      case 'prod':
        return 'https://api.moveecar.com';
      default:
        return 'http://localhost:3000';
    }
  }
}
