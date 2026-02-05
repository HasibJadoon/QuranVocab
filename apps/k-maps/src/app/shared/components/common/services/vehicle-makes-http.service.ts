import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { expand, map, reduce } from 'rxjs/operators';
import { ITranscoding } from '../models/transcoding.model';

export interface IVehicleMake {
  _id?: string;
  code: string;
  name: string;
  // Transcodage
  transcoding?: ITranscoding[];
  // wmis
  wmis?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleMakesHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  search(query: string, page: number, per_page: number, filters: any, sort: string, fields: string): Observable<HttpResponse<IVehicleMake[]>> {
    return this.httpClient.get<IVehicleMake[]>(`${this.env.apiUrl}/v2/common/private/vehicles/makes/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: {
        ...filters
      },
      observe: 'response'
    });
  }

  get(id: string): Observable<IVehicleMake> {
    return this.httpClient.get<IVehicleMake>(`${this.env.apiUrl}/v2/common/private/vehicles/makes/${id}`);
  }

  getAll(query: string, filters: any, sort: string, fields: string): Observable<IVehicleMake[]> {
    return this.getPage(1, query, filters, sort, fields).pipe(
      expand((data, i) => (data.next ? this.getPage(data.next, query, filters, sort, fields) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  private getPage(page: number, query: string, filters: any, sort: string, fields: string): Observable<{ next: number; results: IVehicleMake[] }> {
    return this.search('', page, 100, filters, sort, fields).pipe(
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
