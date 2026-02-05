import { HttpClient } from '@angular/common/http';
import { ErrorHandler, Injectable, OnDestroy } from '@angular/core';
import { DateTime } from 'luxon';
import { interval, of, Subscription } from 'rxjs';
import { catchError, concatMap, filter, map } from 'rxjs/operators';

import { McitEnvService } from './env.service';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { logError } from '../helpers/error.helper';

interface ILog {
  type: string;
  date: string;
  user?: {
    guid: string;
    username: string;
    context: any;
    device: Device | 'COMPUTER' | null;
  };
  message: any;
  others?: any;
}

enum IGNORED_ERROR {
  FAILED_0 = 'Failed response 0',
  NO_CORDOVA_POSITION = 'No found cordova position',
  NO_HTML_POSITION = 'No found html position'
}
const IgnoredErrors: Array<string> = Object.keys(IGNORED_ERROR).map((k) => IGNORED_ERROR[k]);

@Injectable({
  providedIn: 'root'
})
export class McitWatchLogService implements OnDestroy {
  private url: string;

  private installed = false;
  private originals: any = {};
  private historyLogs: ILog[] = [];
  private username: string;
  private userContext: any;
  private device: Device | 'COMPUTER' | null;
  private guid: string;

  private subscriptions: Subscription[] = [];

  constructor(private envService: McitEnvService, private httpClient: HttpClient) {
    this.guid = this.buildGuid();
  }

  initWatchDog(): void {
    this.subscriptions.push(
      this.envService
        .env$()
        .pipe(filter((env) => env && !!env.watchLogUrl))
        .subscribe((env) => {
          this.url = env.watchLogUrl;
          this.installLoggers();
        })
    );
  }

  private installLoggers(): void {
    const console = window.console;
    if (!console) {
      return;
    }

    const intercept = (method) => {
      this.originals[method] = console[method];
      console[method] = (message, others) => {
        this.putLog(method, message, others);
      };
    };

    const methods = ['error'];
    for (const method of methods) {
      intercept(method);
    }

    this.installed = true;

    this.subscriptions.push(
      interval(10000)
        .pipe(
          filter(() => this.historyLogs.length > 0),
          map(() => {
            const res: ILog[] = [];
            let i = 0;
            while (i < 10 && this.historyLogs.length > 0) {
              res.push(this.historyLogs.shift());
              i++;
            }
            return res;
          }),
          concatMap((res) =>
            this.httpClient.post(this.url, res).pipe(
              catchError((err) => {
                this.originals['error'](err);
                return of(null);
              })
            )
          )
        )
        .subscribe()
    );
  }

  setUsername(username: string): void {
    this.username = username;
  }

  setUserContext(context: any): void {
    this.userContext = context;
  }

  setDevice(device: Device | 'COMPUTER' | null): void {
    this.device = device;
  }

  putLog(method: string, message: any, others: any): void {
    if (!this.installed) {
      if (console[method].apply) {
        console[method](message, others);
      } else {
        console[method](message);
      }
    } else {
      if (!IgnoredErrors.find((ignErr) => (typeof message === 'string' ? message : JSON.stringify(message)).startsWith(ignErr))) {
        this.historyLogs.push({
          date: DateTime.local().toISO(),
          type: method,
          user: { guid: this.guid, username: this.username, context: this.userContext, device: this.device },
          message,
          others
        });
      }

      if (this.originals[method].apply) {
        // Do this for normal browsers
        this.originals[method](message, others);
      } else {
        // Do this for IE
        this.originals[method](message);
      }
    }
  }

  putLogWithoutNotification(method: string, message: any, others: any): void {
    if (!this.installed) {
      if (console[method].apply) {
        console[method](message, others);
      } else {
        console[method](message);
      }
    } else {
      if (this.originals[method].apply) {
        // Do this for normal browsers
        this.originals[method](message, others);
      } else {
        // Do this for IE
        this.originals[method](message);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private buildGuid(): string {
    const nav = window.navigator;
    const screen = window.screen;
    const len = nav.mimeTypes.length;
    return [nav.userAgent.replace(/\D+/g, ''), nav.plugins.length, screen.height || '', screen.width || '', screen.pixelDepth || ''].join('');
  }
}

@Injectable({
  providedIn: 'root'
})
export class McitErrorHandler implements ErrorHandler {
  url: string;
  subscriptions: any;

  constructor() {}

  handleError(error: Error) {
    logError(error?.message, {
      error
    });
  }
}
