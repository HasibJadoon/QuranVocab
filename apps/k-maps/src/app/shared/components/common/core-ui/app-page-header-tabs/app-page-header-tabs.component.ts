import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PageHeaderTabsConfig, PageHeaderTabItem } from '../../../../models/core/page-header.model';

@Component({
  selector: 'app-page-header-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-page-header-tabs.component.html',
  styleUrls: ['./app-page-header-tabs.component.scss'],
})
export class AppPageHeaderTabsComponent {
  private readonly router = inject(Router);

  @Input({ required: true }) config!: PageHeaderTabsConfig;

  trackByTabId(_: number, tab: PageHeaderTabItem) {
    return tab.id;
  }

  isActive(tabId: string) {
    return this.config.activeTabId === tabId;
  }

  navigate(commands: any[], queryParams?: Record<string, unknown>) {
    if (queryParams) {
      this.router.navigate(commands, {
        queryParams,
        queryParamsHandling: 'merge',
      });
      return;
    }
    this.router.navigate(commands);
  }
}
