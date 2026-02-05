import { catchError, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { Component, ComponentRef, InjectionToken, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { merge, of, Subscription } from 'rxjs';
import { McitMessageLayout, McitMessageLayoutService } from '../../services/message-layout.service';
import { ITitleOptions, McitTitleService } from '../../services/title.service';
import { McitMenuSidenavComponent } from '../widgets/menu-sidenav/menu-sidenav.component';
import { McitCoreConfig, McitCoreEnv } from '../../helpers/provider.helper';
import { ISubtitleOptions, McitSubtitleService } from '../subtitle.service';
import * as lodash from 'lodash';
import { Location } from '@angular/common';
import { CdkPortalOutlet, ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ISyncStatus, McitSyncLayoutService } from '../../services/sync-layout.service';
import { INetworkStatus, McitNetworkLayoutService } from '../../services/network-layout.service';
import { McitInfoModalService } from '../../info-modal/info-modal.service';
import { McitDateTranslatePipe } from '../../common/pipes/date-translate.pipe';
import { doCatch } from '../../helpers/error.helper';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

export const MCIT_MENU_LAYOUT_CONTEXT_DATA = new InjectionToken<any>('MCIT_MENU_LAYOUT_CONTEXT_DATA');

@Component({
  selector: 'mcit-menu-layout',
  templateUrl: './menu-layout.component.html',
  styleUrls: ['./menu-layout.component.scss'],
  providers: [McitDateTranslatePipe]
})
export class McitMenuLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('menuSidenav', { static: true })
  menuSidenav: McitMenuSidenavComponent;
  @ViewChild(CdkPortalOutlet, { static: true })
  _portalOutlet: CdkPortalOutlet;

  title: string;
  subtitle: string;

  networkStatus: INetworkStatus;
  serverDown = false;
  NETWORK_STATUS = INetworkStatus;
  syncStatus: ISyncStatus;
  SYNC_STATUS = ISyncStatus;

  messageLayout: McitMessageLayout = null;

  useTabMenu = false;
  backButton = false;
  window = window;
  cordova = false;

  private subscriptions: Subscription[] = [];

  private containerRef: ComponentRef<any>;

  constructor(
    private injector: Injector,
    private titleService: McitTitleService,
    private subtitleService: McitSubtitleService,
    private router: Router,
    private route: ActivatedRoute,
    private messageLayoutService: McitMessageLayoutService,
    private syncLayoutService: McitSyncLayoutService,
    private networkLayoutService: McitNetworkLayoutService,
    private config: McitCoreConfig,
    private location: Location,
    private env: McitCoreEnv,
    private infoModalService: McitInfoModalService,
    private dateTranslatePipe: McitDateTranslatePipe,
    private storage: McitStorage
  ) {
    this.useTabMenu = config.useTabMenu;
    this.cordova = env.cordova;
  }

  ngOnInit(): void {
    this.backButton = this.route.snapshot.data.backButton || false;

    this.subscriptions.push(
      merge(
        of(this.lastData(this.route)),
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map(() => this.lastData(this.route))
        )
      ).subscribe((data) => {
        if (data?.title) {
          this.titleService.setTitle(data.title, data.titleParams, data.titleOptions);
          this.subtitleService.setSubtitle(data.subtitle, data.subtitleParams, data.subtitleOptions);
        } else if (data?.subtitle) {
          this.titleService.setTitle('');
          this.subtitleService.setSubtitle(data.subtitle, data.subtitleParams, data.subtitleOptions);
        } else {
          this.titleService.setTitle('');
          this.subtitleService.setSubtitle('');
        }
        if (this.containerRef != null) {
          this._portalOutlet.detach();
          this.containerRef.destroy();
          this.containerRef = null;
        }
        if (data?.contextComponentType) {
          const injector = Injector.create({
            providers: [{ provide: MCIT_MENU_LAYOUT_CONTEXT_DATA, useValue: data.contextData ?? {} }],
            parent: this.injector
          });
          const containerPortal = new ComponentPortal<any>(data.contextComponentType, undefined, injector);

          this.containerRef = this._portalOutlet.attachComponentPortal(containerPortal);
        }
      })
    );

    this.subscriptions.push(
      this.titleService
        .getTitle$()
        .pipe(distinctUntilChanged())
        .subscribe((next) => setTimeout(() => (this.title = next), 0))
    );

    this.subscriptions.push(
      this.subtitleService
        .getSubtitle$()
        .pipe(distinctUntilChanged())
        .subscribe((next) => setTimeout(() => (this.subtitle = next), 0))
    );

    this.subscriptions.push(
      this.messageLayoutService
        .messages$()
        .pipe(map((messages) => (messages ? lodash.sortBy(messages, 'priority') : messages)))
        .subscribe((list) =>
          setTimeout(() => {
            const m = lodash.first(list);
            if (m) {
              this.messageLayout = m;
            } else {
              this.messageLayout = null;
            }
          }, 0)
        )
    );

    this.subscriptions.push(
      this.syncLayoutService
        .syncInfo$()
        .pipe(distinctUntilChanged())
        .subscribe((next) => setTimeout(() => (this.syncStatus = next), 0))
    );

    this.subscriptions.push(
      this.networkLayoutService.networkInfo$
        .pipe(
          distinctUntilChanged(),
          tap((status) => setTimeout(() => (this.networkStatus = status), 0))
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.networkLayoutService.serverDown$
        .pipe(
          distinctUntilChanged(),
          tap((serverDown) => setTimeout(() => (this.serverDown = serverDown), 0))
        )
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
    this._portalOutlet.dispose();
  }

  getTypeMessageLayoutClass(): string {
    if (!this.messageLayout) {
      return '';
    }
    switch (this.messageLayout.type) {
      case 'INFO':
        return 'info';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'error';
    }
    return 'info';
  }

  doBack(): void {
    this.location.back();
  }

  doShowConnectionInfos(): void {
    this.storage
      .get('connection-infos')
      .pipe(
        tap(
          (connectionInfos) =>
            this.infoModalService.showInfo(
              'COMMON.NETWORK_CONNECTION_TITLE',
              'COMMON.NETWORK_CONNECTION_LINE_1',
              'modal-dialog-centered',
              {
                datetime: this.dateTranslatePipe.transform(connectionInfos?.last_network_check_date ?? '', 'hour_minutes_seconds')
              },
              {
                messageKey2: 'COMMON.NETWORK_CONNECTION_LINE_2',
                messageKey3: connectionInfos?.network_unavailable_since_date?.length ? 'COMMON.NETWORK_CONNECTION_LINE_3' : undefined,
                messageParams2: {
                  datetime: this.dateTranslatePipe.transform(connectionInfos?.last_complete_sync_date ?? '', 'hour_minutes_seconds')
                },
                messageParams3: {
                  datetime: this.dateTranslatePipe.transform(connectionInfos?.network_unavailable_since_date ?? '', 'hour_minutes_seconds')
                }
              }
            ),
          catchError((err) => doCatch('doShowConnectionInfos', err, null))
        )
      )
      .subscribe();
  }

  private lastData(r: ActivatedRoute): {
    title: string;
    titleParams: object;
    titleOptions: ITitleOptions;
    subtitle: string;
    subtitleParams: object;
    subtitleOptions: ISubtitleOptions;
    contextComponentType: ComponentType<any>;
    contextData: any;
  } {
    if (r.outlet !== 'primary') {
      return null;
    }
    let data;
    if (r.children?.length > 0) {
      data = lodash.last(r.children?.map((e) => this.lastData(e)).filter((d) => d?.title !== undefined || d?.subtitle !== undefined || d?.contextComponentType !== undefined));
    }
    const current = r.snapshot.data;
    if (!data) {
      data = {};
    }
    if (data?.title === undefined && current?.title !== undefined) {
      data.title = current.title;
      data.titleParams = current.titleParams;
      data.titleOptions = current.titleOptions;
    }
    if (data?.subtitle === undefined && current?.subtitle !== undefined) {
      data.subtitle = current.subtitle;
      data.subtitleParams = current.subtitleParams;
      data.subtitleOptions = current.subtitleOptions;
    }
    if (data?.contextComponentType === undefined) {
      data.contextComponentType = current.contextComponentType;
    }
    if (data?.contextData === undefined) {
      data.contextData = current.contextData;
    }
    return data;
  }
}
