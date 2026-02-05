import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { McitCoreEnv } from '../helpers/provider.helper';

export interface IVehicleVin {
  make: {
    _id: string;
    code: string;
    name: string;
  };
  model: {
    _id: string;
    code: string;
    name: string;
    shape?: {
      code: string;
      name: string;
    };
  };
  services: Array<any>;
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleVinsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(vin: string): Observable<IVehicleVin> {
    return this.httpClient.get<IVehicleVin>(`${this.env.apiUrl}/v2/common/private/vehicles/vins/${vin}`, {
      params: {
        useSearchWmi: 'true'
      }
    });
  }
}
