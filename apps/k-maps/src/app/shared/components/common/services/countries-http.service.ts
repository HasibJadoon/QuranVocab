import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, ReplaySubject } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { ITracable } from '../models/types.model';
import { expand, map, reduce, tap } from 'rxjs/operators';

export interface ICountry extends ITracable {
  _id: string;
  code: string;
  names: {
    [key: string]: string;
  };
  iso_code_2: string;
  iso_code_3: string;
  is_eu?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McitCountriesHttpService {
  private getCacheMap = new Map<string, Observable<ICountry>>();
  private getAllCacheMap = new Map<string, Observable<ICountry[]>>();

  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  search(query: string, page: number, per_page: number, sort: string, fields: string): Observable<HttpResponse<ICountry[]>> {
    return this.httpClient.get<ICountry[]>(`${this.env.apiUrl}/v2/common/private/countries/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      observe: 'response'
    });
  }

  get(id: string): Observable<ICountry> {
    if (this.getCacheMap.has(id)) {
      return this.getCacheMap.get(id);
    }

    const c = new ReplaySubject<ICountry>(1);
    this.getCacheMap.set(id, c);

    return this.httpClient.get<ICountry>(`${this.env.apiUrl}/v2/common/private/countries/${id}`).pipe(
      tap((res) => {
        c.next(res);
        c.complete();
      })
    );
  }

  getAll(sort: string, fields: string): Observable<ICountry[]> {
    const id = `${sort}_${fields}`;

    if (this.getAllCacheMap.has(id)) {
      return this.getAllCacheMap.get(id);
    }

    const c = new ReplaySubject<ICountry[]>(1);
    this.getAllCacheMap.set(id, c);

    return this.getPage(1, sort, fields).pipe(
      expand((data, i) => (data.next ? this.getPage(data.next, sort, fields) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), []),
      tap((res) => {
        c.next(res);
        c.complete();
      })
    );
  }

  private getPage(page: number, sort: string, fields: string): Observable<{ next: number; results: ICountry[] }> {
    return this.search('', page, 100, sort, fields).pipe(
      map((resp) => {
        const totalPages = Number(resp.headers.get('X-TOTAL-PAGES'));
        return {
          next: page < totalPages ? page + 1 : 0,
          results: resp.body
        };
      })
    );
  }
}
