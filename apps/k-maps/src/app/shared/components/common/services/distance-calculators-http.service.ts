import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../../supervision/src/environments/environment';
import { IDistanceCalculator } from '../../../../../supervision/src/app/business/models/distance-calculator.model';
import { IDistanceCalculatorGrid } from '../../../../../supervision/src/app/business/models/distance-calculator-grid.model';
import { IMemberRole } from '../models/member-role.model';
import { IGeoposition } from 'projects/lib-shared/src/lib/common/models/types.model';
import { InitialDistanceCalculator } from '../models/domains/distance-calculator.domain';

export interface IDistanceResult {
  distance: number;
  ptv_ref_distance?: number;
  duration: number;
  system: string;
  default?: InitialDistanceCalculator;
  polyline?: { x: number; y: number }[];
  events: IEvent[];
  origin?: {
    place_id?: string;
    place_name?: string;
    geoposition?: IGeoposition;
  };
  destination?: {
    place_id?: string;
    place_name?: string;
    geoposition?: IGeoposition;
  };
  partial_origin?: {
    place_id?: string;
    place_name?: string;
    geoposition?: IGeoposition;
  };
  partial_destination?: {
    place_id?: string;
    place_name?: string;
    geoposition?: IGeoposition;
  };
}

export interface IEvent {
  $type: string;
  eventType: PTVEVENTS.COUNTRY_EVENT | PTVEVENTS.WAYPOINT_EVENT;
  coordinate: {
    x: number;
    y: number;
  };
  distanceFromStart: number;
  travelTimeFromStart: number;
  country?: string;
}

export enum PTVEVENTS {
  WAYPOINT_EVENT = 'WAYPOINT_EVENT',
  COUNTRY_EVENT = 'COUNTRY_EVENT'
}

@Injectable({
  providedIn: 'root'
})
export class DistanceCalculatorsHttpService {
  constructor(private http: HttpClient) {}

  search(query: string, page: number, per_page: number, sort: string, fields: string): Observable<HttpResponse<IDistanceCalculator[]>> {
    return this.http.get<IDistanceCalculator[]>(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      observe: 'response'
    });
  }

  searchAllBy(query: string, sort: string, fields: string): Observable<HttpResponse<IDistanceCalculator[]>> {
    return this.http.get<IDistanceCalculator[]>(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/search-all-by/?q=${query}&sort=${sort}&fields=${fields}`, {
      observe: 'response'
    });
  }

  get(id: string): Observable<IDistanceCalculator> {
    return this.http.get<IDistanceCalculator>(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/${id}`);
  }

  create(distance: IDistanceCalculator): Observable<string> {
    return this.http.post(`${environment.apiUrl}/v2/admin/referentials/distance-calculators`, distance, {
      responseType: 'text'
    });
  }

  update(distance: IDistanceCalculator): Observable<string> {
    return this.http.put(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/${distance._id}`, distance, {
      responseType: 'text'
    });
  }

  confirmImport(id: string): Observable<string> {
    return this.http.get<string>(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/distance-calculator-grid/confirm-import/${id}`);
  }

  getDistanceCalculatorGrids(distanceId: string): Observable<IDistanceCalculatorGrid[]> {
    return this.http.get<IDistanceCalculatorGrid[]>(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/distance-calculator-grid/${distanceId}`);
  }

  getExampleMassSimulationFile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/mass-simulation/export/example`, {
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }

  getDistanceCalculatorGridExcelExport(gridId?: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/v2/admin/referentials/distance-calculators/distance-calculator-grid/export/${gridId ?? 'example'}`, {
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }

  calculateDistance(origin: IMemberRole, destination: IMemberRole, code: string, needPolyline?: boolean, publicBackend?: boolean): Observable<IDistanceResult | null> {
    const calculateDistanceUrl = publicBackend ? 'v1/public/maps/route' : 'v2/admin/referentials/distance-calculators/calculate';
    return this.http.post<IDistanceResult | null>(
      `${environment.apiUrl}/${calculateDistanceUrl}`,
      { origin, destination, code, needPolyline, publicBackend },
      {
        responseType: 'json'
      }
    );
  }
}
