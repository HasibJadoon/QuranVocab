import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { McitAuthProviderService } from '../services/auth-provider.service';
import { AuthRoutes } from '../models/auth-routes.enum';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitPopupService } from '../../services/popup.service';
import { HttpErrorResponse } from '@angular/common/http';
import * as lodash from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class McitRolesGuardService {
  constructor(private authProviderService: McitAuthProviderService, private coreConfig: McitCoreConfig, private router: Router, private popupService: McitPopupService) {}

  public canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          this.authProviderService.logout();
          return of(false);
        }
        return this.authProviderService.whoIAm().pipe(
          map((user) => {
            const roles: string[] = lodash.get(route, 'data.roles', []);
            if (roles.length === 0) {
              return true;
            }

            const userHasRole = lodash.intersection(lodash.get(user, `apps.${this.coreConfig.app}.roles`, []), roles).length > 0;

            if (!userHasRole) {
              console.error('User has not role');

              this.popupService.showError('AUTH_GUARD.NOT_ROLE');

              return this.router.createUrlTree([AuthRoutes.forbidden]);
            }
            return true;
          }),
          catchError((error) => {
            if (!(error instanceof HttpErrorResponse) || lodash.get(error, 'status', 400) !== 401) {
              return of(this.router.createUrlTree([AuthRoutes.forbidden]));
            }
            return of(false);
          })
        );
      })
    );
  }

  public canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.canActivate(route);
  }
}
