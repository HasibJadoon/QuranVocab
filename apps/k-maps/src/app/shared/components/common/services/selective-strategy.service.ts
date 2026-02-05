import { Observable, of, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { concatMap, tap, catchError, map } from 'rxjs/operators';

@Injectable()
export class McitSelectivePreloadingStrategyService implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data?.['preload']) {
      return timer(0 /*5000*/).pipe(
        map(() => load()), // /!\ Do not mergeMap or concatMap /!\
        // tap(() => console.log(`Preloading ${route.path}`)),
        catchError(() => of(null))
      );
    }
    return of(null);
  }
}
