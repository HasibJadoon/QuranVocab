import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateTime } from 'luxon';
import { Observable, of, throwError } from 'rxjs';
import * as moment from 'moment-timezone';

import { McitCoreConfig, McitCoreEnv } from '../helpers/provider.helper';
import { catchError, concatMap, map, take, tap } from 'rxjs/operators';
import { IVersion } from '../check-version/check-version.service';
import { doCatch, logError } from '../helpers/error.helper';
import { McitContextHeaderService } from '../context-header/services/context-header.service';
import { AppContext } from '../context-header/models/context-header.model';
import { environment } from '../../../../../driver/src/environments/environment';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

@Injectable({
  providedIn: 'root'
})
export class McitHttpInterceptorService implements HttpInterceptor {
  private mobileAppVersion: IVersion;

  constructor(private translateService: TranslateService, private config: McitCoreConfig, private httpClient: HttpClient, private env: McitCoreEnv, private storage: McitStorage, private contextHeaderService: McitContextHeaderService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.contextHeaderService.currentContainerContext$.pipe(
      take(1),
      concatMap((containerContext) =>
        (this.env?.cordova && this.config.app === 'driver' && !this.mobileAppVersion && (req?.url?.startsWith(`${environment.apiUrl}/v2/driver`) || req?.url?.startsWith(`${environment.apiUrl}/v2/common/public/driver`))
          ? this.httpClient.get<IVersion>('mobile-app-version.json').pipe(
              tap((version) => (this.mobileAppVersion = version)),
              catchError((err) => doCatch('getMobileAppVersion', err, null))
            )
          : of(null)
        ).pipe(
          map(() => this.updateRequest(req, containerContext?.current)),
          concatMap((newReq) =>
            next.handle(newReq).pipe(
              catchError((err: Error) => {
                if (err instanceof HttpErrorResponse) {
                  logError(`Failed response ${err.status} from ${err.url}`, { error: err, infos: req.body });
                }
                return throwError(err);
              })
            )
          )
        )
      )
    );
  }

  private updateRequest(req: HttpRequest<any>, context: AppContext): HttpRequest<any> {
    const date = DateTime.local();
    let headers = {};
    if (req.headers.has('App-Context-Id') && req.headers.has('App-Context-Name') && req.headers.has('App-Context-Type')) {
      headers = {
        app: this.config.app,
        'Time-Offset': date.toString(),
        'Time-Zone': moment.tz.guess(),
        'App-Version': this.mobileAppVersion?.version ?? this.env?.appVersion ?? 'unknow'
      };
    } else {
      headers = {
        app: this.config.app,
        'Time-Offset': date.toString(),
        'Time-Zone': moment.tz.guess(),
        'App-Version': this.mobileAppVersion?.version ?? this.env?.appVersion ?? 'unknow',
        'App-Context-Id': context?._id ?? '',
        'App-Context-Name': context?.name ?? '',
        'App-Context-Type': context?.type ?? ''
      };
    }
    return req.clone({
      setHeaders: headers,
      setParams: {
        lang: this.translateService.currentLang
      }
    });
  }
}
