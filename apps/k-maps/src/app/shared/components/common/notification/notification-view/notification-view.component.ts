import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Observable, of, Subject, SubscriptionLike } from 'rxjs';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitAuthProviderService } from '../../auth';
import { INotificationMessage, McitNotificationsHttpService } from '../../services/notifications-http.service';
import { catchError, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { McitNotificationModalComponent } from '../notification-modal/notification-modal.component';
import { McitDialog } from '../../dialog/dialog.service';
import { McitPopupService } from '../../services/popup.service';
import { PER_PAGE, PER_PAGES } from '../../helpers/pagination.helper';
import { ActivatedRoute } from '@angular/router';
import { McitQuestionModalService } from '../../question-modal/question-modal.service';

@Component({
  selector: 'mcit-notification-view',
  templateUrl: './notification-view.component.html',
  styleUrls: ['./notification-view.component.scss']
})
export class McitNotificationViewComponent implements OnInit, AfterViewInit, OnDestroy {
  notifications$: Observable<INotificationMessage[]>;
  private subscriptions: SubscriptionLike[] = [];
  private refreshSubject = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();
  private authorization = false;

  selectedNotifications: string[] = [];

  public total: number;
  public totalPages: number;
  public per_page: number;
  public page: number;

  constructor(
    private coreConfig: McitCoreConfig,
    private authProviderService: McitAuthProviderService,
    private notificationsHttpService: McitNotificationsHttpService,
    private dialog: McitDialog,
    private popupService: McitPopupService,
    private route: ActivatedRoute,
    private questionModalService: McitQuestionModalService
  ) {}

  ngOnInit() {
    this.page = this.route.snapshot.queryParams.page ? Number(this.route.snapshot.queryParams.page) : 1;
    this.per_page = this.route.snapshot.queryParams.page ? Number(this.route.snapshot.queryParams.per_page) : PER_PAGE;

    this.subscriptions.push(
      this.authProviderService.authorization$.subscribe((next) => {
        this.authorization = next;
      })
    );

    this.subscriptions.push(
      this.refreshSubject.pipe(filter((f) => f && this.authorization)).subscribe(
        () =>
          (this.notifications$ = this.notificationsHttpService
            .search(
              '',
              {
                application: this.coreConfig.app.toUpperCase()
              },
              this.page,
              this.per_page,
              '-created_date',
              'objects,severity,created_date,from_name,read'
            )
            .pipe(
              tap((res) => {
                this.total = Number(res.headers.get('X-Total'));
                this.totalPages = Number(res.headers.get('X-Total-Pages'));
              }),
              map((resp) => resp.body),
              catchError((err) => {
                console.error('Failed to get notification message', err);
                return of([]);
              })
            ))
      )
    );

    this.subscriptions.push(
      this.paginationSubject
        .asObservable()
        .pipe(
          map((p) => ({
            page: p.page < 1 ? 1 : p.page,
            per_page: PER_PAGES.indexOf(p.per_page) ? p.per_page : 10
          })),
          distinctUntilChanged(),
          tap((p) => {
            this.page = p.page;
            this.per_page = p.per_page;
          })
        )
        .subscribe(() => this.refreshSubject.next(true))
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.refreshSubject.next(true);
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  openNotification(id: string) {
    this.dialog
      .open<McitNotificationModalComponent, any, any>(McitNotificationModalComponent, {
        dialogClass: 'modal-xl',
        autoFocus: false,
        disableClose: false,
        data: {
          ids: [id]
        }
      })
      .afterClosed()
      .subscribe((next) => {
        this.refreshSubject.next(true);
      });
  }

  doDeleteNotification(id: string) {
    this.questionModalService.showQuestion('NOTIFICATION.DELETE.TITLE', 'NOTIFICATION.DELETE.QUESTION', 'COMMON.ERASE', 'COMMON.CANCEL', true).subscribe((next) => {
      if (next) {
        this.notificationsHttpService.delete(id).subscribe(
          () => this.refreshSubject.next(true),
          (err) => {
            this.popupService.showError();
            console.error(err);
          }
        );
      }
    });
  }

  selectNotification(id: string) {
    if (this.selectedNotifications.indexOf(id) >= 0) {
      this.selectedNotifications.splice(this.selectedNotifications.indexOf(id), 1);
    } else {
      this.selectedNotifications.push(id);
    }
  }

  selectAll(notifications: INotificationMessage[]) {
    if (notifications.length === this.selectedNotifications.length) {
      this.selectedNotifications = [];
    } else {
      this.selectedNotifications = notifications.map((item) => item._id);
    }
  }

  deleteAll() {
    this.questionModalService.showQuestion('NOTIFICATION.DELETE.MULTIPLE_TITLE', 'NOTIFICATION.DELETE.MULTIPLE_QUESTION', 'COMMON.ERASE', 'COMMON.CANCEL', true).subscribe((next) => {
      if (next) {
        forkJoin(this.selectedNotifications.map((item) => this.notificationsHttpService.delete(item))).subscribe(
          () => this.refreshSubject.next(true),
          (err) => {
            this.popupService.showError();
            console.error(err);
          }
        );
      }
    });
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doPerPage(per_page: number): void {
    this.paginationSubject.next({ page: 1, per_page });
  }
}
