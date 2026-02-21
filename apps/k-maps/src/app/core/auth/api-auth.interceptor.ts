import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE } from '../../shared/api-base';
import { AuthService } from '../../shared/services/AuthService';

@Injectable()
export class ApiAuthInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiBase = API_BASE.replace(/\/+$/, '');
  private redirecting = false;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const withToken = this.withAuthorization(request);

    return next.handle(withToken).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && this.shouldHandleUnauthorized(withToken.url)) {
          this.auth.logout();

          if (!this.redirecting && !this.router.url.startsWith('/login')) {
            this.redirecting = true;
            void this.router.navigateByUrl('/login', { replaceUrl: true }).finally(() => {
              this.redirecting = false;
            });
          }
        }

        return throwError(() => error);
      })
    );
  }

  private withAuthorization(request: HttpRequest<unknown>): HttpRequest<unknown> {
    if (!this.shouldAttachToken(request.url) || request.headers.has('authorization')) {
      return request;
    }

    const token = this.auth.token;
    if (!token) {
      return request;
    }

    return request.clone({
      setHeaders: {
        authorization: `Bearer ${token}`,
      },
    });
  }

  private shouldAttachToken(url: string): boolean {
    if (!this.isApiRequest(url)) {
      return false;
    }

    return !this.isAuthPath(url);
  }

  private shouldHandleUnauthorized(url: string): boolean {
    return this.shouldAttachToken(url);
  }

  private isApiRequest(url: string): boolean {
    if (this.apiBase.startsWith('http://') || this.apiBase.startsWith('https://')) {
      return url.startsWith(this.apiBase);
    }

    return url.startsWith(this.apiBase) || url.startsWith('/api') || url.startsWith('api/');
  }

  private isAuthPath(url: string): boolean {
    const normalized = url.toLowerCase();
    return normalized.endsWith('/login') || normalized.includes('/login?');
  }
}

