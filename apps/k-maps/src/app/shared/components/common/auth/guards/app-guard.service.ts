import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitAuthProviderService } from '../services/auth-provider.service';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitPopupService } from '../../services/popup.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class McitAppGuardService {
  constructor(private authProviderService: McitAuthProviderService, private coreConfig: McitCoreConfig, private popupService: McitPopupService) {}

  public canActivate(): Observable<boolean> {
    return this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          this.authProviderService.logout();
          return of(false);
        }
        return this.authProviderService.whoIAm().pipe(
          map((user) => {
            if (lodash.isNil(user)) {
              this.authProviderService.logout();
              return false;
            }
            if (lodash.isNil(lodash.get(user, `apps.${this.coreConfig.app}`))) {
              console.error(`User not acces to use app ${this.coreConfig.app}`);

              this.popupService.showError('AUTH_GUARD.NOT_ACCESS_APP');

              this.authProviderService.logout();
              return false;
            }
            return true;
          }),
          catchError((error) => {
            if (!(error instanceof HttpErrorResponse) || lodash.get(error, 'status', 400) !== 401) {
              this.authProviderService.logout();
            }
            return of(false);
          })
        );
      })
    );
  }

  public canActivateChild(): Observable<boolean> {
    return this.canActivate();
  }
}
