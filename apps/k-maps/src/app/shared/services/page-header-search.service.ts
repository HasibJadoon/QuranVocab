import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PageHeaderSearchConfig } from '../models/core/page-header.model';

@Injectable({ providedIn: 'root' })
export class PageHeaderSearchService {
  private readonly configSubject = new BehaviorSubject<PageHeaderSearchConfig | null>(null);

  readonly config$ = this.configSubject.asObservable();

  setConfig(config: PageHeaderSearchConfig) {
    this.configSubject.next(config);
  }

  clearConfig() {
    this.configSubject.next(null);
  }
}
