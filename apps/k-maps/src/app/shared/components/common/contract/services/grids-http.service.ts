import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IGrid } from '@lib-shared/common/contract/contract.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GridsHttpService {
  constructor(private http: HttpClient, private config: McitCoreConfig, private env: McitCoreEnv) {}

  get(id: string): Observable<IGrid> {
    return this.http.get<IGrid>(`${this.env.apiUrl}/v2/${this.config.app}/grids/${id}`);
  }
}
