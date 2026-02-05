import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { concatMap, map, shareReplay, take, tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import * as lodash from 'lodash';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class McitStorage {
  private init$: Observable<Storage>;

  private cache: { [key: string]: any } = {};

  constructor(storage: Storage, env: McitCoreEnv) {
    this.init$ = from(env.cordova ? storage.defineDriver(CordovaSQLiteDriver) : of(undefined)).pipe(
      takeUntilDestroyed(),
      concatMap(() => storage.create()),
      shareReplay(1)
    );
  }

  get driver(): Observable<string | null> {
    return from(this.init$).pipe(
      take(1),
      map((storage) => storage.driver)
    );
  }

  get(key: string): Observable<any> {
    return from(this.init$).pipe(
      take(1),
      concatMap((storage) => {
        if (key in this.cache) {
          return of(lodash.cloneDeep(this.cache[key]));
        }
        return from(storage.get(key)).pipe(
          tap((v) => {
            this.cache[key] = v;
          })
        );
      })
    );
  }

  set(key: string, value: any): Observable<any> {
    return from(this.init$).pipe(
      take(1),
      tap((storage) => {
        if (value != null) {
          this.cache[key] = value;
        }
        setTimeout(() => {
          storage.set(key, value).then().catch();
        }, 0);
      }),
      map(() => value)
    );
  }

  remove(key: string): Observable<any> {
    return from(this.init$).pipe(
      take(1),
      tap((storage) => {
        delete this.cache[key];
        setTimeout(() => {
          storage.remove(key).then().catch();
        }, 0);
      }),
      map(() => true)
    );
  }

  clear(): Observable<void> {
    return from(this.init$).pipe(
      tap((storage) => {
        this.cache = {};
        setTimeout(() => {
          storage.clear().then().catch();
        }, 0);
      }),
      map(() => void 0)
    );
  }

  length(): Observable<number> {
    return from(this.init$).pipe(
      take(1),
      concatMap((storage) => storage.length())
    );
  }

  keys(): Observable<string[]> {
    return from(this.init$).pipe(
      take(1),
      concatMap((storage) => storage.keys())
    );
  }

  forEach(iteratorCallback: (value: any, key: string, iterationNumber: number) => any): Observable<void> {
    return from(this.init$).pipe(
      take(1),
      concatMap((storage) => from(storage.forEach(iteratorCallback)).pipe(tap(() => (this.cache = {}))))
    );
  }
}
