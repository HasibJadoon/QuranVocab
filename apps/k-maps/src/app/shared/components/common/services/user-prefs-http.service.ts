import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface IUserPref<E> {
  data?: E;
}

@Injectable({
  providedIn: 'root'
})
export class McitUserPrefsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  save<E>(key: string, saveTable: IUserPref<E>): Observable<HttpResponse<any>> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/common/private/user-prefs/${key}`, saveTable, {
      observe: 'response'
    });
  }

  get<E>(key: string, fields: string): Observable<IUserPref<E>> {
    return this.httpClient.get<IUserPref<E>>(`${this.env.apiUrl}/v2/common/private/user-prefs/${key}?fields=${fields}`);
  }
}
