import { Injectable } from '@angular/core';
import { McitCoreEnv } from '../helpers/provider.helper';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { IVehicleShape } from '../models/vehicle/vehicle-shape.model';

export interface IShapeFieldFilter {
  code?: string;
  meaning?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleShapeHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(id: string): Observable<IVehicleShape> {
    return this.httpClient.get<IVehicleShape>(`${this.env.apiUrl}/v2/common/private/vehicles/shapes/${id}`);
  }

  search(q: string, sort: string, fields: string, filters: IShapeFieldFilter, page?: number, per_page?: number): Observable<HttpResponse<Array<IVehicleShape>>> {
    return this.httpClient.get<Array<IVehicleShape>>(`${this.env.apiUrl}/v2/common/private/vehicles/shapes?&page=${page ?? 1}&per_page=${per_page ?? 10}`, {
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

  create(shape: IVehicleShape): Observable<IVehicleShape> {
    return this.httpClient.post<IVehicleShape>(`${this.env.apiUrl}/v2/common/private/vehicles/shapes`, shape);
  }

  update(idOrCode: string, shape: IVehicleShape): Observable<IVehicleShape> {
    return this.httpClient.patch<IVehicleShape>(`${this.env.apiUrl}/v2/common/private/vehicles/shapes/${idOrCode}`, shape);
  }

  delete(idOrCode: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.env.apiUrl}/v2/common/private/vehicles/shapes/${idOrCode}`);
  }
}
