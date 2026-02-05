import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { expand, map, reduce } from 'rxjs/operators';
import { ITranscoding } from '../models/transcoding.model';

export interface IVehicleModel {
  _id: string;
  code: string;
  name: string;
  shapes?: IVehicleShape[];
  transcoding: ITranscoding[];
}

export interface IVehicleShape {
  code: string;
  name: string;
  transcoding: ITranscoding[];
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleModelsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  search(make_id: string, query: string, page: number, per_page: number, filters: any, sort: string, fields: string): Observable<HttpResponse<IVehicleModel[]>> {
    return this.httpClient.get<IVehicleModel[]>(`${this.env.apiUrl}/v2/common/private/vehicles/models/?make_id=${make_id}&q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: {
        ...filters
      },
      observe: 'response'
    });
  }

  get(make_id: string, id: string): Observable<IVehicleModel> {
    return this.httpClient.get<IVehicleModel>(`${this.env.apiUrl}/v2/common/private/vehicles/models/${id}?make_id=${make_id}`);
  }

  getAll(maker_id: string, query: string, filters: any, sort: string, fields: string): Observable<IVehicleModel[]> {
    return this.getPage(maker_id, 1, query, filters, sort, fields).pipe(
      expand((data, i) => (data.next ? this.getPage(maker_id, data.next, query, filters, sort, fields) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  private getPage(make_id: string, page: number, query: string, filters: any, sort: string, fields: string): Observable<{ next: number; results: IVehicleModel[] }> {
    return this.search(make_id, query, page, 100, filters, sort, fields).pipe(
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
