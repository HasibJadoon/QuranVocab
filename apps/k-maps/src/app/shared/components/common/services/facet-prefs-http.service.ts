import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface IFavoriteFacetPref {
  name: string;
  value: {
    categories: {
      [key: string]: any;
    };
  };
  created_date: Date;
}

export interface IFacetPref {
  favorites?: IFavoriteFacetPref[];
  settings?: any;
}

@Injectable({
  providedIn: 'root'
})
export class McitFacetPrefsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  save(key: string, saveFacet: IFacetPref): Observable<HttpResponse<any>> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/common/private/facet-prefs/${key}`, saveFacet, {
      observe: 'response'
    });
  }

  get(key: string, fields: string): Observable<IFacetPref> {
    return this.httpClient.get<IFacetPref>(`${this.env.apiUrl}/v2/common/private/facet-prefs/${key}?fields=${fields}`);
  }
}
