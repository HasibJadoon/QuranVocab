import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { Component, ComponentRef, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { merge, of, Subscription } from 'rxjs';
import { ITitleOptions, McitTitleService } from '../../services/title.service';
import { ISubtitleOptions, McitSubtitleService } from '../subtitle.service';
import * as lodash from 'lodash';
import { CdkPortalOutlet, ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { MCIT_MENU_LAYOUT_CONTEXT_DATA } from '@lib-shared/common/layouts/menu-layout/menu-layout.component';

@Component({
  selector: 'mcit-back-layout',
  templateUrl: './back-layout.component.html',
  styleUrls: ['./back-layout.component.scss']
})
export class McitBackLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(CdkPortalOutlet, { static: true })
  _portalOutlet: CdkPortalOutlet;

  title: string;
  subtitle: string;

  noBackButton = false;

  private subscriptions: Subscription[] = [];

  private containerRef: ComponentRef<any>;

  constructor(private titleService: McitTitleService, private subtitleService: McitSubtitleService, private location: Location, private router: Router, private route: ActivatedRoute, private injector: Injector) {}

  ngOnInit(): void {
    this.noBackButton = this.route.snapshot.data.noBackButton || false;

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

        if (data?.contextComponentType) {
          if (this.containerRef != null) {
            this._portalOutlet.detach();
            this.containerRef.destroy();
            this.containerRef = null;
          }

          const injector = Injector.create({
            providers: [{ provide: MCIT_MENU_LAYOUT_CONTEXT_DATA, useValue: data.contextData ?? {} }],
            parent: this.injector
          });
          const containerPortal = new ComponentPortal<any>(data.contextComponentType, undefined, injector);

          this.containerRef = this._portalOutlet.attachComponentPortal(containerPortal);
        } else {
          if (this.containerRef != null) {
            this._portalOutlet.detach();
            this.containerRef.destroy();
            this.containerRef = null;
          }
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
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
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

  doBack(): void {
    this.location.back();
  }
}
