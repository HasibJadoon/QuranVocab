import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class McitUrlHttpService {
  private cacheMap = new Map<string, Observable<string>>();

  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(appli: string): Observable<string> {
    if (this.cacheMap.has(appli)) {
      return this.cacheMap.get(appli);
    }

    const c = new ReplaySubject<string>(1);
    this.cacheMap.set(appli, c);

    return this.httpClient.get<string>(`${this.env.apiUrl}/v2/common/private/url/${appli}`).pipe(
      tap((res) => {
        c.next(res);
        c.complete();
      })
    );
  }
}
