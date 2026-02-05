import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, concatMap, filter, switchMap, take } from 'rxjs/operators';

import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitAuthProviderService } from './auth-provider.service';

@Injectable({
  providedIn: 'root'
})
export class McitAuthInterceptorService implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);

  constructor(private authProviderService: McitAuthProviderService, private config: McitCoreConfig) {}

  private isWhitelisted(req: HttpRequest<any>): boolean {
    return !req.url.includes('/api/') || this.config.ignoreUrls.find((pattern) => req.url.includes(pattern)) != null;
  }

  /**
   * before each ajax request
   * @param req the request to be intercepted
   * @param next the request handler instance
   */
  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isWhitelisted(req)) {
      return next.handle(req);
    } else {
      return this.authProviderService
        .addAuthToken(req)
        .pipe(switchMap((r) => next.handle(r)))
        .pipe(
          catchError((error: Error) => {
            const status = error instanceof HttpErrorResponse ? error.status : null;
            if (status !== 401 && status !== 498) {
              return throwError(error);
            }
            console.log(`Failed to auth for request ${req.url}, use refresh token`);
            if (this.refreshTokenInProgress) {
              console.log(`Refresh token in progress ${req.url}`);
              return this.refreshTokenSubject.pipe(
                filter((result) => result !== null),
                take(1),
                switchMap(() => this.authProviderService.addAuthToken(req).pipe(switchMap((r) => next.handle(r))))
              );
            } else {
              this.refreshTokenInProgress = true;
              this.refreshTokenSubject.next(null);

              return this.authProviderService.refresh().pipe(
                switchMap((token) => {
                  console.log(`New access token with refresh token for request ${req.url}`);

                  this.refreshTokenInProgress = false;
                  this.refreshTokenSubject.next(token);

                  return this.authProviderService.addAuthToken(req).pipe(switchMap((r) => next.handle(r)));
                }),
                catchError((err) => {
                  console.log(`Failed to use refresh token for request ${req.url}`);

                  this.refreshTokenInProgress = false;
                  this.refreshTokenSubject.error('Failed to use refresh token');

                  this.authProviderService.logout();
                  return throwError(error);
                })
              );
            }
          })
        );
    }
  }
}
