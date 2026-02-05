import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';

export interface ITitleOptions {
  noTranslate?: boolean;
  titleWindowOnly?: boolean;
  noUpdateTitleWindow?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McitTitleService {
  private translateSubscription: Subscription;

  private subject: Subject<string> = new BehaviorSubject<string>('Moveecar');

  constructor(private title: Title, private translateService: TranslateService) {}

  setTitle(key: string, params?: object, options?: ITitleOptions) {
    if (this.translateSubscription) {
      this.translateSubscription.unsubscribe();
      this.translateSubscription = null;
    }
    if (key) {
      this.translateSubscription = of(lodash.get(options, 'noTranslate', false))
        .pipe(
          switchMap((n) => (n || !key ? of(key) : this.translateService.stream(key, params))),
          tap((t) => {
            if (!lodash.get(options, 'noUpdateTitleWindow', false)) {
              this.title.setTitle(t);
            }
          })
        )
        .subscribe((next) => {
          if (!lodash.get(options, 'titleWindowOnly', false)) {
            this.subject.next(next);
          } else {
            this.subject.next('');
          }
        });
    } else {
      this.title.setTitle('Moveecar');
      this.subject.next('');
    }
  }

  getTitle$(): Observable<string> {
    return this.subject.asObservable();
  }
}
