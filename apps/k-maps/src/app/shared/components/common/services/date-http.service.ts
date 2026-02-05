import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface INowDate {
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitDateHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  now(): Observable<INowDate> {
    return this.httpClient.get<INowDate>(`${this.env.apiUrl}/v2/common/public/date/now`);
  }
}
