import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { McitCoreEnv } from '../helpers/provider.helper';
import { DateTime } from 'luxon';

const CHECK_INTERVAL = 1000 * 60 * 5;

export interface IVersion {
  version: string;
  buildDate: string;
  env: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitCheckVersionService {
  private firstVersionSubject = new BehaviorSubject<IVersion>(null);
  private observable: Observable<boolean>;

  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {
    if (this.env.production) {
      this.httpClient.get<IVersion>('version.json').subscribe(
        (next) => {
          this.firstVersionSubject.next(next);
        },
        (err) => {
          this.firstVersionSubject.next(null);
        }
      );
    } else {
      this.firstVersionSubject.next({
        version: '0.0.0',
        buildDate: DateTime.local().toISO({ includeOffset: false }),
        env: 'local'
      });
    }

    this.observable = interval(CHECK_INTERVAL).pipe(
      filter(() => this.firstVersionSubject.value != null && this.env.production),
      switchMap(() => this.httpClient.get<IVersion>('version.json').pipe(catchError(() => of(null)))),
      map((nv) => {
        if (!nv) {
          return false;
        }
        const firstVersion = this.firstVersionSubject.value;
        return nv.version !== firstVersion.version || nv.buildDate !== firstVersion.buildDate;
      })
    );
  }

  version$(): Observable<IVersion> {
    return this.firstVersionSubject.asObservable();
  }

  checkNewVersion$(): Observable<boolean> {
    return this.observable;
  }
}
