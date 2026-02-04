import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PageHeaderTabsConfig } from '../models/core/page-header.model';

@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  private readonly tabsSubject = new BehaviorSubject<PageHeaderTabsConfig | null>(null);

  readonly tabs$ = this.tabsSubject.asObservable();

  setTabs(config: PageHeaderTabsConfig) {
    this.tabsSubject.next(config);
  }

  clearTabs() {
    this.tabsSubject.next(null);
  }
}
