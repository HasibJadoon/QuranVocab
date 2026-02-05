import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import * as lodash from 'lodash';
import { switchMap } from 'rxjs/operators';

export interface ISubtitleOptions {
  noTranslate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McitSubtitleService {
  private translateSubscription: Subscription;

  private subject: Subject<string> = new BehaviorSubject<string>(null);

  constructor(private translateService: TranslateService) {}

  setSubtitle(key: string, params?: object, options?: ISubtitleOptions) {
    if (this.translateSubscription) {
      this.translateSubscription.unsubscribe();
      this.translateSubscription = null;
    }
    if (key) {
      this.translateSubscription = of(lodash.get(options, 'noTranslate', false))
        .pipe(switchMap((n) => (n || !key ? of(key) : this.translateService.stream(key, params))))
        .subscribe((next) => {
          this.subject.next(next);
        });
    } else {
      this.subject.next('');
    }
  }

  getSubtitle$(): Observable<string> {
    return this.subject.asObservable();
  }
}
