import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import * as _ from 'lodash';
import { IVehicleColour } from '../models/vehicle/vehicle-colour.model';

export interface IColourFieldFilter {
  transcoding_entity?: string;
  transcoding_x_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleColourHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(idOrCode: string): Observable<IVehicleColour> {
    return this.httpClient.get<IVehicleColour>(`${this.env.apiUrl}/v2/common/private/vehicles/colours/${idOrCode}`);
  }

  search(q: string, sort: string, fields: string, filters: IColourFieldFilter, page?: number, per_page?: number): Observable<HttpResponse<Array<IVehicleColour>>> {
    return this.httpClient.get<Array<IVehicleColour>>(`${this.env.apiUrl}/v2/common/private/vehicles/colours?&page=${page}&per_page=${per_page}`, {
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

  create(colour: IVehicleColour): Observable<IVehicleColour> {
    return this.httpClient.post<IVehicleColour>(`${this.env.apiUrl}/v2/common/private/vehicles/colours`, colour);
  }

  update(idOrCode: string, colour: IVehicleColour): Observable<IVehicleColour> {
    return this.httpClient.patch<IVehicleColour>(`${this.env.apiUrl}/v2/common/private/vehicles/colours/${idOrCode}`, colour);
  }

  delete(idOrCode: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.env.apiUrl}/v2/common/private/vehicles/colours/${idOrCode}`);
  }
}
