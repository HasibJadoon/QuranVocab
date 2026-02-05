import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import * as lodash from 'lodash';
import { McitFacetPrefsHttpService } from '../services/facet-prefs-http.service';
import { McitCoreConfig } from '../helpers/provider.helper';
import { catchError, switchMap } from 'rxjs/operators';
import { ISettingsModel } from './facet-model';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

const DEFAULTS: ISettingsModel = {
  saveDisplayMode: 'auto'
};

@Injectable()
export class McitFacetSettingsService {
  private facetes: {
    [key: string]: {
      initialSettings: ISettingsModel;
      subject: Subject<ISettingsModel>;
    };
  } = {};

  constructor(private config: McitCoreConfig, private storage: McitStorage, private facetPrefsHttpService: McitFacetPrefsHttpService) {}

  initSettings(id: string, initialSettings: ISettingsModel): void {
    this.facetes[id] = {
      initialSettings,
      subject: new ReplaySubject<ISettingsModel>(1)
    };

    const key = `facet-${this.config.app}-${id}`;
    this.facetPrefsHttpService
      .get(key, 'settings')
      .pipe(
        catchError((err) => {
          console.error(err);
          return of({
            settings: null
          });
        })
      )
      .subscribe((next) => {
        if (!next) {
          next = {
            settings: null
          };
        }
        this.facetes[id].subject.next(lodash.defaultsDeep({}, next ? next.settings : null, initialSettings, DEFAULTS));
      });
  }

  settings$(id: string): Observable<ISettingsModel> {
    return this.facetes[id].subject.asObservable();
  }

  settings(id: string, settings: ISettingsModel): void {
    const key = `facet-${this.config.app}-${id}`;
    this.facetPrefsHttpService
      .get(key, 'settings')
      .pipe(
        switchMap((p) => {
          if (!p) {
            p = {
              settings: null
            };
          }
          p.settings = settings;
          return this.facetPrefsHttpService.save(key, p);
        })
      )
      .subscribe();

    this.facetes[id].subject.next(settings);
  }

  reset(id: string): void {
    const key = `facet-${this.config.app}-${id}`;
    this.facetPrefsHttpService
      .get(key, 'settings')
      .pipe(
        switchMap((p) => {
          if (!p) {
            p = {
              settings: null
            };
          }
          p.settings = null;
          return this.facetPrefsHttpService.save(key, p);
        })
      )
      .subscribe();

    this.facetes[id].subject.next(lodash.defaultsDeep({}, this.facetes[id].initialSettings, DEFAULTS));
  }
}
