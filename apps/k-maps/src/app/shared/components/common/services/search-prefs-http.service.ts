import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface IFavoriteSearchPref {
  name: string;
  value: {
    text: string;
    tags: Array<any>;
    filters: {
      [key: string]: any;
    };
    sort?: string;
  };
  created_date: Date;
}

export interface ISearchPref {
  favorites?: IFavoriteSearchPref[];
  settings?: any;
}

@Injectable({
  providedIn: 'root'
})
export class McitSearchPrefsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  save(key: string, saveSearch: ISearchPref): Observable<HttpResponse<any>> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/common/private/search-prefs/${key}`, saveSearch, {
      observe: 'response'
    });
  }

  get(key: string, fields: string): Observable<ISearchPref> {
    return this.httpClient.get<ISearchPref>(`${this.env.apiUrl}/v2/common/private/search-prefs/${key}?fields=${fields}`);
  }
}
