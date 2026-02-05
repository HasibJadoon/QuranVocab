import { Component, OnInit } from '@angular/core';
import { interval, merge, Observable, of, Subject, timer } from 'rxjs';
import { INotificationMessage, McitNotificationsHttpService } from '../services/notifications-http.service';
import { catchError, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { McitCoreConfig } from '../helpers/provider.helper';
import * as lodash from 'lodash';
import { McitDialog } from '../dialog/dialog.service';
import { McitNotificationModalComponent } from './notification-modal/notification-modal.component';
import { McitAuthProviderService } from '../auth/services/auth-provider.service';
import { INetworkStatus, McitNetworkLayoutService } from '../services/network-layout.service';

const CHECK_INTERVAL = 1000 * 60 * 5;
const SHOW_TIMEOUT = 1000 * 7;

@Component({
  selector: 'mcit-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss']
})
export class McitNotificationPopupComponent implements OnInit {
  result$: Observable<{ open: boolean; message: INotificationMessage; messageIds: string[]; total: number }>;

  private refreshSubject = new Subject<boolean>();
  private authorization = false;

  constructor(
    private coreConfig: McitCoreConfig,
    private authProviderService: McitAuthProviderService,
    private notificationsHttpService: McitNotificationsHttpService,
    private dialog: McitDialog,
    private networkLayouService: McitNetworkLayoutService
  ) {}

  ngOnInit(): void {
    this.result$ = merge(
      timer(0, CHECK_INTERVAL).pipe(map(() => true)),
      this.authProviderService.authorization$.pipe(
        tap((next) => (this.authorization = !!next)),
        map(() => true)
      ),
      this.refreshSubject.asObservable()
    ).pipe(
      filter((f) => f),
      switchMap(() => this.networkLayouService.networkInfo$.pipe(take(1))),
      filter((status) => status === INetworkStatus.online),
      switchMap(() =>
        this.authorization
          ? this.notificationsHttpService
              .search(
                '',
                {
                  read: 'false',
                  application: this.coreConfig.app.toUpperCase()
                },
                1,
                10,
                'created_date',
                'objects,severity,created_date,from_name'
              )
              .pipe(
                map((resp) => ({
                  total: Number(resp.headers.get('X-Total')),
                  result: resp.body
                })),
                catchError((err) => {
                  console.error('Failed to get notification message', err);
                  return of({ total: 0, result: [] as INotificationMessage[] });
                }),
                distinctUntilChanged((a, b) => lodash.head(a.result)?._id !== lodash.head(b.result)?._id),
                map((data) => {
                  const message = lodash.head(data.result);
                  return {
                    open: message != null,
                    message,
                    messageIds: data.result.map((m) => m._id),
                    total: data.total
                  };
                }),
                switchMap((res) =>
                  res.open
                    ? merge(
                        of(res),
                        interval(SHOW_TIMEOUT).pipe(
                          take(1),
                          map(() => ({
                            ...res,
                            open: false
                          }))
                        )
                      )
                    : of(res)
                )
              )
          : of({
              open: false,
              message: null,
              messageIds: [],
              total: 0
            })
      )
    );
  }

  doShowMessages(messageIds: string[]): void {
    this.dialog
      .open<McitNotificationModalComponent, any, any>(McitNotificationModalComponent, {
        dialogClass: 'modal-xl',
        autoFocus: false,
        disableClose: false,
        data: {
          ids: messageIds
        }
      })
      .afterClosed()
      .subscribe((next) => {
        this.refreshSubject.next(true);
      });
  }
}
