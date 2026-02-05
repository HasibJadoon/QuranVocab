import { Injectable, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { concatMap, map, take, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { McitCoreEnv } from '../helpers/provider.helper';
import * as lodash from 'lodash';
import { McitMessageLayout, McitMessageLayoutService } from './message-layout.service';

export enum INetworkStatus {
  online = 'online',
  offline = 'offline'
}

@Injectable({
  providedIn: 'root'
})
export class McitNetworkLayoutService implements OnDestroy {
  networkInfo$: Observable<INetworkStatus>;
  serverDown$: Observable<boolean>;
  status: INetworkStatus;

  private serverDownSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private messageLayout: McitMessageLayout = null;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private network: Network, private env: McitCoreEnv, private messageLayoutService: McitMessageLayoutService) {
    this.status = window?.navigator?.onLine ? INetworkStatus.online : INetworkStatus.offline;
    this.networkInfo$ = this.env.cordova
      ? timer(0, 1000).pipe(
          takeUntil(this.destroy$),
          concatMap(() => this.serverDown$.pipe(take(1))),
          map((serverDown) => {
            const onlineStatus = lodash.compact([this.network.Connection.UNKNOWN, this.network.Connection.NONE].filter((noNetworkType) => noNetworkType === this.network?.type))?.length || serverDown ? INetworkStatus.offline : this.status;
            if (onlineStatus === INetworkStatus.online) {
              if (this.messageLayout) {
                this.messageLayoutService.removeMessage(this.messageLayout.id);
                this.messageLayout = null;
              }
            } else {
              this.messageLayout = this.messageLayoutService.addMessage({
                id: 'NO_NETWORK',
                priority: 10,
                type: serverDown ? 'WARNING' : 'ERROR',
                messageKey: serverDown ? 'MESSAGE-LAYOUT.SERVER_UNAVAILABLE' : 'MESSAGE-LAYOUT.NO_NETWORK',
                extraMessageKey: 'MESSAGE-LAYOUT.EXTRA_MESSAGE'
              });
            }
            return onlineStatus;
          })
        )
      : timer(0, 1000).pipe(
          takeUntil(this.destroy$),
          map(() => this.status)
        );

    this.serverDown$ = this.serverDownSubject.asObservable().pipe(takeUntil(this.destroy$), shareReplay(1));

    this.network
      .onConnect()
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.online())
      )
      .subscribe();
    this.network
      .onDisconnect()
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.offline())
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  online() {
    this.status = INetworkStatus.online;
    this.serverDownSubject.next(false);
  }

  offline() {
    this.status = INetworkStatus.offline;
  }

  serverUp() {
    this.serverDownSubject.next(false);
  }

  serverDown() {
    this.serverDownSubject.next(true);
  }
}
