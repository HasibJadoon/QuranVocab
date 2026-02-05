import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface IVehicleRecognition {
  results?: string[];
  raw?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class McitVehicleRecognitionHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  detectVinOrLicensePlate(formData: FormData): Observable<IVehicleRecognition> {
    return this.httpClient.post<IVehicleRecognition>(`${this.env.apiUrl}/v2/common/private/vehicles/recognition`, formData, {
      headers: {
        'use-skipper': 'disabled'
      }
    });
  }
}
