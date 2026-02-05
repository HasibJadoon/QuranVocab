import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PageHeaderPaginationConfig } from '../models/core/page-header.model';

@Injectable({ providedIn: 'root' })
export class PageHeaderPaginationService {
  private readonly configSubject = new BehaviorSubject<PageHeaderPaginationConfig | null>(null);

  readonly config$ = this.configSubject.asObservable();

  setConfig(config: PageHeaderPaginationConfig) {
    this.configSubject.next(config);
  }

  clearConfig() {
    this.configSubject.next(null);
  }
}
