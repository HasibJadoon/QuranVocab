import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface IEnv {
  siteId?: string;
  matomoBasePath?: string;
  supportId?: string;
  supportBasePath?: string;
  watchLogUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class McitEnvService {
  private init = false;
  private envSubject: Subject<IEnv> = new ReplaySubject<IEnv>(1);

  constructor(private httpClient: HttpClient) {}

  private load(): void {
    this.httpClient
      .get<IEnv>('env.json')
      .pipe(
        catchError(() =>
          of({
            siteId: '0',
            matomoBasePath: null,
            supportId: '53371cadca1bfe2e0d6c60235452254a',
            supportBasePath: null,
            watchLogUrl: 'https://gateway.moveecar.io/watchlog/PRD_WATCH_LOG?client=local&env=local'
          })
        )
      )
      .subscribe((next) => {
        this.envSubject.next(next);
      });
  }

  env$(): Observable<IEnv> {
    if (!this.init) {
      this.init = true;
      this.load();
    }
    return this.envSubject.asObservable();
  }
}
