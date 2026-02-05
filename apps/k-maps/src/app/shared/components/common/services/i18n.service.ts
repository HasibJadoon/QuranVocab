import { EventEmitter, Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as merge from 'deepmerge';

const DEFAULT_EXTENDED: string = null;

export interface McitI18nExtendedChangeEvent {
  extended: string;
}

export interface McitTranslationResource {
  prefix: string;
  suffix: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitI18nService {
  private _currentExtended: string = DEFAULT_EXTENDED;
  private _onExtendedChangeEvent: EventEmitter<McitI18nExtendedChangeEvent> = new EventEmitter<McitI18nExtendedChangeEvent>();

  get defaultExtended(): string {
    return DEFAULT_EXTENDED;
  }

  get currentExtended(): string {
    return this._currentExtended;
  }

  get onExtendedChangeEvent(): EventEmitter<McitI18nExtendedChangeEvent> {
    return this._onExtendedChangeEvent;
  }

  constructor(private httpClient: HttpClient) {}

  useExtended(extended: string): void {
    if ((!extended && !this.currentExtended) || extended === this.currentExtended) {
      return;
    }
    this._currentExtended = extended;

    this._onExtendedChangeEvent.emit({ extended });
  }

  getExtended(): string {
    return this._currentExtended;
  }

  createTranslateLoader(resources: McitTranslationResource[]): TranslateLoader {
    const exts = new Map<string, McitMultiTranslateHttpLoader>();
    return {
      getTranslation: (lang: string): Observable<any> =>
        of(this._currentExtended).pipe(
          tap(() => console.log(`[I18N] Get translate ${lang} ${this._currentExtended}`)),
          map((extended) => extended || ''),
          concatMap((extended) => {
            let l = exts.get(extended);
            if (l == null) {
              l = new McitMultiTranslateHttpLoader(
                this.httpClient,
                resources.map((r) => ({
                  prefix: r.prefix,
                  suffix: extended ? `${r.suffix}?extended=${extended}` : r.suffix
                }))
              );
              exts.set(extended, l);
            }
            return l.getTranslation(lang);
          })
        )
    };
  }
}

class McitMultiTranslateHttpLoader extends TranslateLoader {
  constructor(private http: HttpClient, private resources: McitTranslationResource[]) {
    super();
  }

  getTranslation(lang: string): Observable<any> {
    const requests = this.resources.map((resource) => {
      const path = resource.prefix + lang + resource.suffix;
      return this.http.get(path).pipe(
        catchError((res) => {
          console.error('Could not find translation file:', path);
          return of({});
        })
      );
    });
    return forkJoin(requests).pipe(map((response) => merge.all(response.filter((r) => r))));
  }
}
