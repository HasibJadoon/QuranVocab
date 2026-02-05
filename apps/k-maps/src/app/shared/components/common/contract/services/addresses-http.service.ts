import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { IAddress } from '@lib-shared/common/models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressesHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv, private config: McitCoreConfig) {}

  search(query: string, page: number, per_page: number, filters: { role?: string }, sort: string, fields: string): Observable<HttpResponse<IAddress[]>> {
    return this.httpClient.get<IAddress[]>(`${this.env.apiUrl}/v2/${this.config.app}/addresses/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: filters,
      observe: 'response'
    });
  }

  get(id: string): Observable<IAddress> {
    return this.httpClient.get<IAddress>(`${this.env.apiUrl}/v2/${this.config.app}/addresses/${id}`);
  }

  update(address: IAddress): Observable<string> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/${this.config.app}/addresses/${address._id}`, address, {
      responseType: 'text'
    });
  }

  create(address: IAddress): Observable<string> {
    return this.httpClient.post(`${this.env.apiUrl}/v2/${this.config.app}/addresses`, address, {
      responseType: 'text'
    });
  }
}
