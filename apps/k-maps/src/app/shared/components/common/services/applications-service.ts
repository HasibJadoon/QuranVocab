import { Injectable } from '@angular/core';
import { EMPTY, from, Observable, of } from 'rxjs';
import { McitAuthProviderService } from '../auth/services/auth-provider.service';
import { McitUrlHttpService } from './url-http.service';
import { catchError, filter, map, mergeMap, shareReplay, switchMap, toArray, take, defaultIfEmpty } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitCoreEnv } from '../helpers/provider.helper';

interface IApp {
  icon: string;
  nameKey: string;
}

const APPS: { [key: string]: IApp } = {
  supervision: {
    icon: 'fad fa-user-cog',
    nameKey: 'APPLICATIONS.SUPERVISION'
  },
  fvl: {
    icon: 'fad fa-inbox',
    nameKey: 'APPLICATIONS.FVL'
  },
  dispatcher: {
    icon: 'fad fa-shipping-fast',
    nameKey: 'APPLICATIONS.DISPATCHER'
  },
  compound: {
    icon: 'fad fa-warehouse',
    nameKey: 'APPLICATIONS.COMPOUND'
  },
  accounting: {
    icon: 'fad fa-envelope-open-dollar',
    nameKey: 'APPLICATIONS.ACCOUNTING'
  },
  driver: {
    icon: 'fad fa-steering-wheel',
    nameKey: 'APPLICATIONS.DRIVER'
  },
  customer: {
    icon: 'fad fa-address-card',
    nameKey: 'APPLICATIONS.CUSTOMER'
  }
};

export interface IApplication extends IApp {
  key: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitApplicationsService {
  private _applications$: Observable<IApplication[]>;

  constructor(private env: McitCoreEnv, private authProviderService: McitAuthProviderService, private urlHttpService: McitUrlHttpService) {
    this._applications$ = this.authProviderService.authorization$.pipe(
      filter((b) => b && !env.cordova),
      switchMap(() => this.authProviderService.whoIAm().pipe(take(1))),
      switchMap((user) => {
        if (user == null) {
          return of([]);
        }
        return from(Object.keys(APPS)).pipe(
          filter((key) => user.apps[key]?.valid),
          mergeMap((key) =>
            this.urlHttpService.get(key).pipe(
              catchError(() => EMPTY),
              map((url) => ({
                ...APPS[key],
                key,
                url
              }))
            )
          ),
          toArray(),
          defaultIfEmpty([])
        );
      }),
      map((res) => lodash.sortBy(res, 'key')),
      shareReplay(1)
    );
  }

  applications$(): Observable<IApplication[]> {
    return this._applications$;
  }
}
