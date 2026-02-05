import { catchError, map, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { McitCoreConfig, McitCoreEnv } from '../helpers/provider.helper';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

export interface McitSettings {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class McitSettingsService {
  private settings: McitSettings;
  private subject: Subject<McitSettings>;

  constructor(private translateService: TranslateService, private storage: McitStorage, private config: McitCoreConfig, private env: McitCoreEnv) {
    this.settings = this.config.defaultSettings;

    this.subject = new ReplaySubject<McitSettings>(1);

    this.storage
      .get('settings')
      .pipe(
        tap((val) => {
          this.settings = Object.assign({}, this.config.defaultSettings, val);
          this.subject.next(this.settings);
        }),
        catchError((err) => {
          this.settings = Object.assign({}, this.config.defaultSettings);
          this.subject.next(this.settings);
          return doCatch(`Failed to read storage`, err, null);
        })
      )
      .subscribe();
  }

  getSettings$(): Observable<McitSettings> {
    return this.subject.asObservable();
  }

  getSettingsForKey$(key: string): Observable<any> {
    return this.subject.asObservable().pipe(map((s) => s[key]));
  }

  getSettingsForKey(key: string): any {
    return this.settings[key];
  }

  setSettings(settings: McitSettings): void {
    this.settings = settings;
    this.storage
      .set('settings', this.settings)
      .pipe(catchError((err) => of(undefined)))
      .subscribe();
    this.subject.next(this.settings);
  }

  setSettingsForKey(key: string, value: any): void {
    this.settings[key] = value;
    this.storage
      .set('settings', this.settings)
      .pipe(catchError((err) => of(undefined)))
      .subscribe();
    this.subject.next(this.settings);
  }
}
