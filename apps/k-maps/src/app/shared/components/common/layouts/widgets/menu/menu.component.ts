import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRoutes, McitAuthProviderService } from '../../../auth';
import { Subscription } from 'rxjs';
import { McitMenuService, McitMenuInfoUser, McitMenuItem } from '../../menu.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { McitCoreConfig, McitCoreEnv } from '../../../helpers/provider.helper';

@Component({
  selector: 'mcit-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class McitMenuComponent implements OnInit, OnDestroy {
  @Output()
  itemSelectedEvent = new EventEmitter<void>();

  itemss: McitMenuItem[][];
  infoUser: McitMenuInfoUser;
  avatarUrl: SafeUrl;
  defaultAvatarUrl: string;

  private subscriptions: Subscription[] = [];
  private objectUrls: string[] = [];

  constructor(private menuService: McitMenuService, private router: Router, private authProviderService: McitAuthProviderService, private sanitizer: DomSanitizer, private config: McitCoreConfig, private env: McitCoreEnv) {}

  ngOnInit(): void {
    this.subscriptions.push(this.menuService.items$().subscribe((next) => (this.itemss = [next])));
    this.subscriptions.push(
      this.menuService.infoUser$().subscribe((next) => {
        this.infoUser = next;

        if (next) {
          this.defaultAvatarUrl = `${this.env.apiUrl}/v2/common/public/account/avatar/${next.firstname}-${next.lastname}`;
        } else {
          this.defaultAvatarUrl = null;
        }
      })
    );
    this.subscriptions.push(
      this.menuService.avatar$().subscribe((next) => {
        if (next) {
          const url = window.URL.createObjectURL(next);
          this.objectUrls.push(url);
          this.avatarUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        } else {
          this.avatarUrl = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
    this.objectUrls.forEach((url) => window.URL.revokeObjectURL(url));
  }

  doItemClicked(): void {
    this.itemSelectedEvent.emit();
  }

  doLogout(): void {
    this.authProviderService.setRedirectUrl(this.config.defaultRouteUrl);
    this.authProviderService.logout();

    this.itemSelectedEvent.emit();
  }
}
