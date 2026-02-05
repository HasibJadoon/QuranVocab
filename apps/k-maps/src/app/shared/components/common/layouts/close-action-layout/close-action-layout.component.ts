import { distinctUntilChanged, filter, map, mergeMap } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CloseAction, CloseActionService } from './close-action.service';
import { McitTitleService } from '../../services/title.service';
import { McitSubtitleService } from '../subtitle.service';

@Component({
  selector: 'mcit-close-action-layout',
  templateUrl: './close-action-layout.component.html',
  styleUrls: ['./close-action-layout.component.scss']
})
export class McitCloseActionLayoutComponent implements OnInit, OnDestroy {
  title: string;
  subtitle: string;
  action: string;
  showAction = true;
  isPrimaryBtn = false;

  private subscriptions: Subscription[] = [];

  constructor(private titleService: McitTitleService, private subtitleService: McitSubtitleService, private router: Router, private activatedRoute: ActivatedRoute, private closeActionService: CloseActionService) {}

  ngOnInit(): void {
    const route: ActivatedRoute = this.lastChild(this.activatedRoute);
    this.subscriptions.push(
      route.data.subscribe((data) => {
        if (data) {
          if (data.action != null) {
            this.action = data.action;
          }
          if (data.title != null) {
            this.titleService.setTitle(data.title, data.titleParams, data.titleOptions);
          }
          if (data.subtitle != null) {
            this.subtitleService.setSubtitle(data.subtitle, data.subtitleParams, data.subtitleOptions);
          }
        }
      })
    );

    this.subscriptions.push(
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          map(() => this.lastChild(this.activatedRoute)),
          filter((res) => res.outlet === 'primary'),
          mergeMap((res) => res.data)
        )
        .subscribe((data) => {
          if (data) {
            if (data.action != null) {
              this.action = data.action;
            }
            if (data.title != null) {
              this.titleService.setTitle(data.title, data.titleParams, data.titleOptions);
            }
            if (data.subtitle != null) {
              this.subtitleService.setSubtitle(data.subtitle, data.subtitleParams, data.subtitleOptions);
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

    this.subscriptions.push(
      this.closeActionService
        .showHideAction$()
        .pipe(distinctUntilChanged())
        .subscribe((isShown) => setTimeout(() => (this.showAction = isShown), 0))
    );
    this.subscriptions.push(
      this.closeActionService
        .colorBtnAction$()
        .pipe(distinctUntilChanged())
        .subscribe((isPrimaryColoredBtn) => setTimeout(() => (this.isPrimaryBtn = isPrimaryColoredBtn), 0))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private lastChild(activatedRoute: ActivatedRoute): ActivatedRoute {
    let route: ActivatedRoute = activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  doClose(): void {
    this.closeActionService.close();
  }

  doAction(): void {
    if (this.isPrimaryBtn) {
      this.closeActionService.action(CloseAction.DO_AND_CLOSE);
    } else {
      this.closeActionService.action(CloseAction.OPEN_MODAL);
    }
  }
}
