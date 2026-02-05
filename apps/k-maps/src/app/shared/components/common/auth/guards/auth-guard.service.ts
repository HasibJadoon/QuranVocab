import { Injectable } from '@angular/core';
import { UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitAuthProviderService } from '../services/auth-provider.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class McitAuthGuardService {
  constructor(private authProviderService: McitAuthProviderService) {}

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

  public canActivateChild(): Observable<boolean | UrlTree> {
    return this.canActivate();
  }
}
