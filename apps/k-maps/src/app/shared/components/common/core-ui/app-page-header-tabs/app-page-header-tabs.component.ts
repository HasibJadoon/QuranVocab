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

  navigateTab(tab: PageHeaderTabItem) {
    if (tab.disabled) return;
    this.navigateCommands(tab.commands, tab.queryParams);
  }

  navigate(commands: any[], queryParams?: Record<string, unknown>) {
    this.navigateCommands(commands, queryParams);
  }

  private navigateCommands(commands: any[], queryParams?: Record<string, unknown>) {
    const urlTree = this.router.createUrlTree(commands, {
      queryParams,
      queryParamsHandling: queryParams ? 'merge' : null,
    });
    const targetUrl = this.router.serializeUrl(urlTree);
    if (targetUrl === this.router.url) {
      return;
    }
    void this.router.navigateByUrl(urlTree);
  }
}
