import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import * as _ from 'lodash';
import { IVehicleGefcoMake } from 'projects/supervision/src/app/business/models/vehicle-gefco-make.model';

export interface IVehicleGefcoMakeFilter {
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleGefcoMakesHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  search(q: string, sort: string, fields: string, filters: IVehicleGefcoMakeFilter, page: number = 1, per_page: number = 10): Observable<HttpResponse<Array<IVehicleGefcoMake>>> {
    return this.httpClient.get<Array<IVehicleGefcoMake>>(`${this.env.apiUrl}/v2/common/private/vehicles/gefco-makes?&page=${page}&per_page=${per_page}`, {
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
}
