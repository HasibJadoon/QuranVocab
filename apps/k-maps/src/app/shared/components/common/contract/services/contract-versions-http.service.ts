import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IContractVersion } from '../../../common/contract/contract-version.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';

@Injectable({
  providedIn: 'root'
})
export class ContractVersionsHttpService {
  constructor(private httpClient: HttpClient, private config: McitCoreConfig, private env: McitCoreEnv) {}

  get(id: string): Observable<IContractVersion> {
    return this.httpClient.get<IContractVersion>(`${this.env.apiUrl}/v2/${this.config.app}/contract-versions/${id}`);
  }

  update(contractVersion: IContractVersion): Observable<IContractVersion> {
    return this.httpClient.put<IContractVersion>(`${this.env.apiUrl}/v2/${this.config.app}/contract-versions/${contractVersion._id}`, contractVersion);
  }
}
