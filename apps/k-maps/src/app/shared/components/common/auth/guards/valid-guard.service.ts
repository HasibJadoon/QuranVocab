import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitAuthProviderService } from '../services/auth-provider.service';
import { AuthRoutes } from '../models/auth-routes.enum';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitPopupService } from '../../services/popup.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class McitValidGuardService {
  constructor(private authProviderService: McitAuthProviderService, private coreConfig: McitCoreConfig, private router: Router, private popupService: McitPopupService) {}

  public canActivate(): Observable<boolean | UrlTree> {
    return this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          this.authProviderService.logout();
          return of(false);
        }
        return this.authProviderService.whoIAm().pipe(
          map((user) => {
            if (lodash.isNil(user)) {
              return this.router.createUrlTree([AuthRoutes.login]);
            }
            const valid = lodash.get(user, `apps.${this.coreConfig.app}.valid`, false);
            if (!valid) {
              this.popupService.showError('AUTH_GUARD.NOT_VALID');

              return this.router.createUrlTree([AuthRoutes.forbidden], {
                queryParams: { state: 'NO_VALID' }
              });
            }
            return true;
          }),
          catchError((error) => {
            console.error('valid-guard canActivate', error);
            if (!(error instanceof HttpErrorResponse) || lodash.get(error, 'status', 400) !== 401) {
              return of(this.router.createUrlTree([AuthRoutes.forbidden]));
            }
            return of(false);
          })
        );
      })
    );
  }

  public canActivateChild(): Observable<boolean | UrlTree> {
    return this.canActivate();
  }
}
