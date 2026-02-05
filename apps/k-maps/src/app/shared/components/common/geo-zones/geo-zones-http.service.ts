import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IThirdParty } from '../third-party/third-party.model';
import { McitCoreEnv } from '../helpers/provider.helper';
import { GeoPlaceReference, GeoZone } from './geo-zone.model';

@Injectable({
  providedIn: 'root'
})
export class GeoZoneHttpService {
  private url = `${this.env.apiUrl}/v2/common/private/zones`;

  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}
  countByContext(id: string): Observable<number> {
    return this.httpClient.get<number>(`${this.url}/countbycontext/${id}`);
  }

  autocomplete(qs: string | null, contextId: string, fields?: string, resultLength: number = 5, ignoreContext: boolean = false): Observable<Array<GeoZone>> {
    let params = new HttpParams();
    params = params.append('per_page', String(resultLength));
    params = params.append('sort', '-created_date');
    if (fields && fields.length > 0) {
      params = params.append('fields', fields);
    }
    if (qs && qs.length > 0) {
      params = params.append('q', qs);
    }
    if (contextId && contextId.length > 0) {
      params = params.append('context_id', contextId);
    }
    if (ignoreContext) {
      params = params.append('ignore_context', 'false');
    }
    params = params.append('fvl_check', 'false');
    return this.httpClient.get<Array<GeoZone>>(`${this.url}`, { params });
  }

  autocompleteFillContextId(qs: string | null, contextIdString: string, fields?: string, resultLength: number = 5, ignoreContext: boolean = false): Observable<Array<GeoZone>> {
    let params = new HttpParams();
    params = params.append('per_page', String(resultLength));
    params = params.append('sort', '-created_date');
    if (fields && fields.length > 0) {
      params = params.append('fields', fields);
    }
    if (qs && qs.length > 0) {
      params = params.append('q', qs);
    }
    if (contextIdString) {
      params = params.append('context_id_string', contextIdString);
    }
    if (ignoreContext) {
      params = params.append('ignore_context', 'false');
    }
    params = params.append('fvl_check', 'false');
    return this.httpClient.get<Array<GeoZone>>(`${this.url}`, { params });
  }

  createZone(zone: Partial<GeoZone>): Observable<GeoZone> {
    return this.httpClient.post<GeoZone>(`${this.url}`, zone);
  }

  updateZone(zone: GeoZone): Observable<GeoZone> {
    return this.httpClient.put<GeoZone>(`${this.url}/${zone._id}`, zone);
  }

  deleteZone(zone: GeoZone): Observable<void> {
    return this.httpClient.delete<void>(`${this.url}/${zone._id}`);
  }

  getZone(zone_id: string): Observable<GeoZone> {
    return this.httpClient.get<GeoZone>(`${this.url}/${zone_id}`);
  }

  attachPlace(id: string, place: GeoPlaceReference): Observable<GeoZone> {
    return this.httpClient.post<GeoZone>(`${this.url}/${id}/places`, place);
  }

  detachPlace(id: string, place: GeoPlaceReference): Observable<void> {
    let params = new HttpParams().append('country_code', place.country_code);
    if (place.zip) {
      params = params.append('zip', place.zip);
    }
    return this.httpClient.delete<void>(`${this.url}/${id}/places`, {
      params
    });
  }

  attachThirdParty(zone_id: string, thirdParty: IThirdParty): Observable<GeoZone> {
    return this.httpClient.post<GeoZone>(`${this.url}/${zone_id}/thirdparties`, thirdParty);
  }

  detachThirdParty(zone_id: string, thirdParty: IThirdParty): Observable<void> {
    return this.httpClient.delete<void>(`${this.url}/${zone_id}/thirdparties`, {
      params: new HttpParams().append('_id', thirdParty._id)
    });
  }

  exportZones(thirdPartyId: string | null, fvlCheck: boolean): Observable<HttpResponse<ArrayBuffer>> {
    let params = new HttpParams();
    params = params.append('sort', '-created_date');
    params = params.append('fvl_check', String(fvlCheck));
    if (thirdPartyId) {
      params = params.append('third_party_id', thirdPartyId);
    }
    return this.httpClient.put(
      `${this.url}/grid/export`,
      {},
      {
        params,
        observe: 'response',
        responseType: 'arraybuffer'
      }
    );
  }

  checkCsv(resourceId: string) {
    return this.httpClient.get<GeoZone[]>(`${this.url}/grid/check?file_id=${resourceId}`, {
      observe: 'response'
    });
  }

  importCsv(resourceId: string, fvlCheck: boolean, contextId?: string): Observable<HttpResponse<GeoZone>> {
    return this.httpClient.get<GeoZone>(`${this.url}/grid/import?file_id=${resourceId}&context_id=${contextId}&fvl_check=${fvlCheck}`, {
      headers: {
        'use-skipper': 'disabled'
      },
      observe: 'response'
    });
  }

  getApiUploadGridEndPoint() {
    return `${this.url}/grid/upload`;
  }
}
