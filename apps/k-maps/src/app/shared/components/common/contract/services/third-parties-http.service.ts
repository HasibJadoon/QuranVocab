import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { IThirdParty } from '@lib-shared/common/third-party/third-party.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';

@Injectable({
  providedIn: 'root'
})
export class ThirdPartiesHttpService {
  constructor(private http: HttpClient, private env: McitCoreEnv, private config: McitCoreConfig) {}

  autocomplete(query: string, per_page: number, filters: { role?: string; excluded_role?: string }, fields: string, app?: DispatcherApiRoutesEnum): Observable<IThirdParty[]> {
    return this.http.get<IThirdParty[]>(`${this.env.apiUrl}/v2/${this.config.app}/third-parties/?q=${query}&per_page=${per_page}&fields=${fields}&app=${app}`, {
      params: filters
    });
  }
  
  autocompleteSingle(query: string, per_page: number, filters: { role?: string; excluded_role?: string }, fields: string, app?: DispatcherApiRoutesEnum): Observable<IThirdParty[]> {
    return this.http.get<IThirdParty[]>(`${this.env.apiUrl}/v2/${this.config.app}/third-parties/autocomplete?q=${query}&per_page=${per_page}&fields=${fields}&app=${app}`, {
      params: filters
    });
  }

  get(id: string): Observable<IThirdParty> {
    if (id) {
      return this.http.get<IThirdParty>(`${this.env.apiUrl}/v2/${this.config.app}/third-parties/${id}`);
    }
    return null;
  }

  public searchThirdParties(query: string, per_page: number, filters: { role?: string; excluded_role?: string; exist?: string; search_agency?: string }, fields: string): Observable<IThirdParty[]> {
    return this.http.get<IThirdParty[]>(`${this.env.apiUrl}/v2/${this.config.app}/third-parties/autocomplete?q=${query}&per_page=${per_page}&fields=${fields}`, {
      params: filters
    });
  }
}
