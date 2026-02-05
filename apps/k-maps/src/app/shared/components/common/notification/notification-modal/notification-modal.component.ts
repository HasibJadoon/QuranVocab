import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { INotificationMessage, McitNotificationsHttpService } from '../../services/notifications-http.service';
import { McitDialogRef } from '../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../dialog/dialog.service';
import { McitWaitingService } from '../../services/waiting.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { McitPopupService } from '../../services/popup.service';

@Component({
  selector: 'mcit-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss']
})
export class McitNotificationModalComponent implements OnInit, OnDestroy {
  message$: Observable<INotificationMessage>;
  hasNext = false;
  total = 0;
  current = 0;

  private posSubject = new BehaviorSubject<number>(0);
  private ids: string[];

  constructor(
    private dialogRef: McitDialogRef<McitNotificationModalComponent, any>,
    private notificationsHttpService: McitNotificationsHttpService,
    @Inject(MCIT_DIALOG_DATA) data: any,
    private waitingService: McitWaitingService,
    private popupService: McitPopupService
  ) {
    this.ids = data.ids;
    this.total = this.ids.length;
  }

  ngOnInit(): void {
    this.message$ = this.posSubject.asObservable().pipe(
      tap((p) => {
        this.waitingService.showWaiting();
        this.current = p + 1;
        this.hasNext = p < this.ids.length - 1;
      }),
      map((p) => this.ids[p]),
      switchMap((id) =>
        this.notificationsHttpService.read(id).pipe(
          catchError((err) => {
            this.popupService.showError();
            return of(null);
          })
        )
      ),
      tap(() => this.waitingService.hideWaiting())
    );
  }

  ngOnDestroy(): void {}

  doClose(): void {
    this.dialogRef.close();
  }

  doNext(): void {
    this.posSubject.next(this.posSubject.value + 1);
  }
}
