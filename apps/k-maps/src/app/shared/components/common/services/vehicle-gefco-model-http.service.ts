import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import * as _ from 'lodash';
import { IGefcoModel } from '../models/vehicle/gefco-model.model';
import { IVehicleColour } from '../models/vehicle/vehicle-colour.model';

export interface IGefcoModelFieldFilter {
  model?: string;
  make?: string;
  article?: string;
  line?: string;
  type?: string;
  engine?: string;
  transmission?: string;
  moveecar_vehicle_make?: string;
  moveecar_vehicle_model?: string;
  moveecar_vehicle_shape?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleGefcoModelHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(idOrCode: string): Observable<IGefcoModel> {
    return this.httpClient.get<IGefcoModel>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/${idOrCode}`);
  }

  searchField(field: string, filters: IGefcoModelFieldFilter, page?: number, per_page?: number): Observable<HttpResponse<Array<any>>> {
    return this.httpClient.get<Array<any>>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/field/${field}?&page=${page ?? 1}&per_page=${per_page ?? 10}`, {
      params: { ...filters },
      observe: 'response'
    });
  }

  search(q: string, sort: string, fields: string, filters: IGefcoModelFieldFilter, page: number = 1, per_page: number = 10): Observable<HttpResponse<Array<any>>> {
    return this.httpClient.get<Array<any>>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models?&page=${page}&per_page=${per_page}`, {
      params: _.omitBy(
        {
          q,
          sort,
          fields,
          ...filters
        },
        _.isNil
      ),
      observe: 'response'
    });
  }

  create(model: IGefcoModel): Observable<IGefcoModel> {
    return this.httpClient.post<IGefcoModel>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models`, model);
  }

  update(idOrCode: string, model: IGefcoModel): Observable<IGefcoModel> {
    return this.httpClient.patch<IGefcoModel>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/${idOrCode}`, model);
  }

  delete(idOrCode: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/${idOrCode}`);
  }

  confirmImportTranscodings(id: string): Observable<any> {
    return this.httpClient.post(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/transcodings/confirm-import/${id}`, {});
  }

  exportTranscodings(q: string, filters: { [param: string]: string }): Observable<any> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/transcodings/export`, {
      params: _.omitBy(
        {
          q,
          ...filters
        },
        _.isNil
      ),
      responseType: 'arraybuffer',
      observe: 'body'
    });
  }

  export(q: string, filters: { [param: string]: string }): Observable<any> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-models/models/export`, {
      params: _.omitBy(
        {
          q,
          ...filters
        },
        _.isNil
      ),
      responseType: 'arraybuffer',
      observe: 'body'
    });
  }
}
