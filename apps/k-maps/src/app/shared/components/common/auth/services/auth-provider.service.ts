import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { catchError, concatMap, distinctUntilChanged, filter, map, mergeMap, tap } from 'rxjs/operators';
import { McitCoreConfig, McitCoreEnv } from '../../helpers/provider.helper';
import { AuthRoutes } from '@lib-shared/common/auth';
import { Credentials } from '@lib-shared/common/auth';
import { User } from '../models/user.model';
import { McitMessageLayoutService } from '../../services/message-layout.service';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

@Injectable({
  providedIn: 'root'
})
export class McitAuthProviderService {
  private redirect: string = this.config.defaultRouteUrl;

  private _authorization: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  public authorization$ = this._authorization.asObservable().pipe(distinctUntilChanged());
  private whoIAmSubject: ReplaySubject<User>;
  private localLogoutSubject: Subject<boolean> = new Subject<boolean>();
  private logoutInterceptor: () => Observable<boolean> | undefined = undefined;

  constructor(private http: HttpClient, private env: McitCoreEnv, private config: McitCoreConfig, private router: Router, private messageLayoutService: McitMessageLayoutService, private storage: McitStorage) {
    this.storage
      .get('authorizationToken')
      .pipe(
        tap((authorizationToken) => this._authorization.next(!!authorizationToken)),
        catchError((err) => doCatch('auth-provider', err, null))
      )
      .subscribe();
  }

  setRedirectUrl(uri: string) {
    this.redirect = uri;
  }

  getRedirectUrl(): string {
    return this.redirect;
  }

  getLoginUrl(): string {
    return AuthRoutes.login;
  }

  removeRedirectUrl(): void {
    this.redirect = this.config.defaultRouteUrl;
  }

  registerLogoutInterceptor(interceptor: () => Observable<boolean>) {
    this.logoutInterceptor = this.logoutInterceptor
      ? () =>
          this.logoutInterceptor().pipe(
            filter((allow) => !!allow),
            concatMap(() => interceptor())
          )
      : interceptor;
  }

  /**
   * Logs the user in
   */
  login(credentials: { username: string; password: string; newpassword?: string }): Observable<number> {
    return this.http.post(`${this.env.apiUrl}/v2/common/public/account/login`, credentials, { observe: 'response' }).pipe(
      concatMap((res) => {
        if (res.status !== 206) {
          return this.setTokens(res.body as Credentials).pipe(map(() => res.status));
        }
        // user migrated code = 206
        return of(res.status);
      }),
      mergeMap((isauth) => {
        if (isauth !== 206) {
          return this.whoIAm().pipe(
            map((res) => 200),
            catchError((error) => of(400))
          );
        }
        return of(isauth);
      })
    );
  }

  /**
   * invalidates tokens
   */
  logout(): void {
    of(true)
      .pipe(
        concatMap(() => (this.logoutInterceptor ? this.logoutInterceptor() : of(true))),
        filter((allow) => !!allow),
        concatMap(() => this.removeTokens()),
        tap(() => {
          this.router.navigate([AuthRoutes.login]);
          this.localLogoutSubject.next(true);
        })
      )
      .subscribe();
  }

  localLogout$(): Observable<boolean> {
    return this.localLogoutSubject.asObservable();
  }

  /**
   * Refreshes an expired authorization token
   */
  refresh(): Observable<any> {
    return forkJoin([this.storage.get('authorizationToken').pipe(catchError(() => null)), this.storage.get('refreshToken').pipe(catchError(() => null))]).pipe(
      tap((r) => {
        if (!r[0] || !r[1]) {
          return throwError('Failed refresh token is empty');
        }
      }),
      concatMap((r) =>
        this.http
          .put<Credentials>(`${this.env.apiUrl}/v2/common/public/account/refresh`, {
            accessToken: r[0],
            refreshToken: r[1]
          })
          .pipe(concatMap((credentials) => this.setTokens(credentials)))
      )
    );
  }

  removeLocalUser(): void {
    if (!this.whoIAmSubject) {
      this.whoIAmSubject = new ReplaySubject(1);
    }
    this.whoIAmSubject.next(null);
  }

  whoIAm(force = false): Observable<User> {
    if (this.whoIAmSubject && !force) {
      return this.whoIAmSubject.asObservable();
    }
    this.whoIAmSubject = new ReplaySubject(1);
    return this.http.get<User>(`${this.env.apiUrl}/v2/common/private/account/whoami`).pipe(
      tap((user) => this.whoIAmSubject.next(user)),
      tap((user) => this.verifyEmail(user)),
      catchError((err) => {
        this.whoIAmSubject.error(err);
        this.whoIAmSubject = null;
        return throwError(err);
      })
    );
  }

  addAuthToken(req: HttpRequest<any>): Observable<HttpRequest<any>> {
    const start = Date.now();
    return this.storage
      .get('authorizationToken')
      .pipe(catchError(() => null))
      .pipe(
        concatMap((authorizationToken) => {
          if (!authorizationToken) {
            return of(req);
          }
          return this.storage.get('authMethod').pipe(
            catchError(() => null),
            map((authMethod) =>
              req.clone({
                setHeaders: {
                  Authorization: `${authMethod} ${authorizationToken}`,
                  'Cache-control': 'no-cache no-store',
                  Expires: '0',
                  Pragma: 'no-cache'
                }
              })
            )
          );
        })
      );
  }

  private verifyEmail(user: User): void {
    if (user.email_verified === 'true') {
      this.messageLayoutService.removeMessage('VERIFY_EMAIL');
    } else {
      this.messageLayoutService.addMessage({
        id: 'VERIFY_EMAIL',
        type: 'WARNING',
        messageKey: 'COMMON.VERIFY_EMAIL',
        link: '/login/verify-email'
      });
    }
  }

  /**
   * Saves token in LocalStorage
   * @param credentials (token, refresh, method)
   * @returns void
   */

  private setTokens(credentials: Credentials): Observable<any> {
    return forkJoin([
      this.storage.set('refreshToken', credentials.refresh_token).pipe(catchError(() => null)),
      this.storage.set('authorizationToken', credentials.authorization_token).pipe(catchError(() => null)),
      this.storage.set('authMethod', credentials.token_type).pipe(catchError(() => null))
    ]).pipe(
      tap((next) => {
        this._authorization.next(credentials.authorization_token != null && credentials.authorization_token.length > 0);
      })
    );
  }

  private removeTokens(): Observable<any> {
    return forkJoin([this.storage.remove('refreshToken').pipe(catchError(() => null)), this.storage.remove('authorizationToken').pipe(catchError(() => null)), this.storage.remove('authMethod').pipe(catchError(() => null))]).pipe(
      tap((next) => {
        this._authorization.next(false);
      })
    );
  }
}
