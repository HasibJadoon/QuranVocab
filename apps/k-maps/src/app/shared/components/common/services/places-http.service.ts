import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, throwError } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { get } from 'lodash';
import { IGeoposition } from '../models/types.model';
import { catchError, concatMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { IMemberRole, IQueryFindPlaceDetail } from '../models/member-role.model';

export interface IAutocompleteResult {
  place_id: string;
  name: string;
  structured_formatting?: any;
  types?: string;
}

export interface IDetailResult {
  place_id: string;
  name: string;
  formatted_address: string;
  address: {
    addr1: string;
    addr2: string;
    zip: string;
    state?: string;
    city: string;
    country: {
      code: string;
      name: string;
    };
    details?: {
      street_number: string;
      route: string;
      neighborhood: string;
      locality: string;
      administrative_area_level_1: string;
      administrative_area_level_2: string;
      administrative_area_level_3: string;
      country: string;
      postal_code: string;
      sublocality_level_1: string;
      sublocality_level_2: string;
      sublocality_level_3: string;
    };
  };
  timezone: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface IReverseResult {
  place_id: string;
  name: string;
}

export interface IRouteResult {
  distance: number;
  duration: number;
  polyline: { x: number; y: number }[];
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
  system?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesHttpService {
  private X_MEMBER_ROLE_LOOKUP: Array<string> = ['address1', 'address2', 'zip', 'city', 'country.name'];
  private cacheRoutes = new Map<string, Observable<{ response: 'result' | 'error'; value: any }>>();

  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  autocomplete(input: string, location: { lat: number; lng: number }, country_code?: string): Observable<IAutocompleteResult[]> {
    let url = `${this.env.apiUrl}/v2/common/private/places/autocomplete`;

    return this.httpClient.get<IAutocompleteResult[]>(
      url,

      {
        params: lodash.omitBy(
          {
            // paris location as default
            location: location ? `${location.lat},${location.lng}` : `48,2`,
            input: input,
            country_code
          },
          lodash.isNil
        )
      }
    );
  }

  detail(placeId: string): Observable<IDetailResult> {
    return this.httpClient.get<IDetailResult>(`${this.env.apiUrl}/v2/common/private/places/${placeId}`);
  }

  findPlaceDetail(memberRole: IMemberRole, forceRecalculWithAddressKeys = false): Observable<IDetailResult> {
    return this.httpClient.get<IDetailResult>(`${this.env.apiUrl}/v2/common/private/places/findPlaceDetail`, {
      params: { ...this.buildFindPlaceDetailParams(memberRole, forceRecalculWithAddressKeys) }
    });
  }

  buildFindPlaceDetailParams(memberRole: IMemberRole, forceRecalculWithAddressKeys = false): IQueryFindPlaceDetail {
    return lodash.omitBy(
      {
        ...lodash.pick(memberRole, ['place_id', 'address1', 'address2', 'address3', 'zip', 'city']),
        third_party_id: memberRole?.third_party_id?.toString(),
        country_name: memberRole?.country?.name,
        latitude: memberRole?.geoposition?.latitude,
        longitude: memberRole?.geoposition?.longitude,
        force_recalcul_with_address_keys: forceRecalculWithAddressKeys
      },
      lodash.isNil
    );
  }

  reverse(position: { lat: number; lng: number }, notStreetAdress?: boolean): Observable<IReverseResult[]> {
    const options = notStreetAdress ? '&not_street_adress=true' : '';
    return this.httpClient.get<IReverseResult[]>(`${this.env.apiUrl}/v2/common/private/places/reverse?location=${position.lat},${position.lng}${options}`);
  }

  route(origin: string, origin_id: string, destination: string, destination_id: string): Observable<any> {
    const parametres: string[] = [];
    if (origin_id) {
      parametres.push(`origin_id=${origin_id}`);
    } else {
      parametres.push(`origin=${encodeURI(origin)}`);
    }
    if (destination_id) {
      parametres.push(`destination_id=${destination_id}`);
    } else {
      parametres.push(`destination=${encodeURI(destination)}`);
    }
    return this.httpClient.get<any>(`${this.env.apiUrl}/v2/common/private/places/route?${parametres.join('&')}`);
  }

  calculateRoute(origin: IMemberRole, destination: IMemberRole, options?: { polyline?: boolean; publicBackend?: boolean; storedProfile?: string }): Observable<IRouteResult> {
    const opts = lodash.defaults({}, options, { polyline: false, publicBackend: false });

    let params = new HttpParams()
      .set('start_place_id', origin.place_id ?? '')
      .set('end_place_id', destination.place_id ?? '')
      .set('start_address', this.buildMemberRoleAdress(origin))
      .set('end_address', this.buildMemberRoleAdress(destination));

    if (opts.polyline != null) {
      params = params.set('polyline', opts.polyline.toString());
    }
    if (opts.storedProfile) {
      params = params.set('storedProfile', opts.storedProfile);
    }
    if (origin.geoposition?.longitude) {
      params = params.set('start_geoposition_longitude', origin.geoposition?.longitude.toString());
    }
    if (origin.geoposition?.latitude) {
      params = params.set('start_geoposition_latitude', origin.geoposition?.latitude.toString());
    }
    if (destination.geoposition?.longitude) {
      params = params.set('end_geoposition_longitude', destination.geoposition?.longitude.toString());
    }
    if (destination.geoposition?.latitude) {
      params = params.set('end_geoposition_latitude', destination.geoposition?.latitude.toString());
    }

    const key = params.toString() + '_' + opts.publicBackend;

    if (this.cacheRoutes.has(key)) {
      const resp$ = this.cacheRoutes.get(key);
      return resp$.pipe(concatMap((resp) => (resp.response === 'result' ? of(resp.value) : throwError(resp.value))));
    }

    const subject = new ReplaySubject<{ response: 'result' | 'error'; value: any }>(1);
    this.cacheRoutes.set(key, subject.asObservable());

    const obs = opts.publicBackend ? this.httpClient.get<IRouteResult>(`${this.env.apiUrl}/v1/public/maps/route`, { params }) : this.httpClient.get<IRouteResult>(`${this.env.apiUrl}/v2/common/private/places/route`, { params });

    return obs.pipe(
      catchError((err) => {
        subject.next({ response: 'error', value: err });
        subject.complete();
        return throwError(err);
      }),
      tap((res) => {
        subject.next({ response: 'result', value: res });
        subject.complete();
      })
    );
  }

  private buildMemberRoleAdress(memberRole: IMemberRole): string {
    return this.X_MEMBER_ROLE_LOOKUP.map((key: string): string => get(memberRole, key, null))
      .filter(Boolean)
      .join(' ');
  }

  details(placeId: string, language: string): Observable<any> {
    return this.httpClient.get<any>(`${this.env.apiUrl}/v1/public/place/details?place_id=${placeId}&language=${language}`);
  }

  address(placeId: string, language: string): Observable<any> {
    return this.httpClient.get<any>(`${this.env.apiUrl}/v1/public/place/full?place_id=${placeId}&language=${language}`);
  }

  reverseV1(position: { lat: number; lng: number }, language: string): Observable<any> {
    return this.httpClient.get<any>(`${this.env.apiUrl}/v1/public/place/reverse?latlng=${position.lat},${position.lng}
    &language=${language}`);
  }
}
