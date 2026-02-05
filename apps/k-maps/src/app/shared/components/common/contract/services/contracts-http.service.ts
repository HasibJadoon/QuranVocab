import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IContractVersion } from '@lib-shared/common/contract/contract-version.model';
import { ContractType } from '@lib-shared/common/contract/contract.domain';
import { IContract, IGrid } from '@lib-shared/common/contract/contract.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import * as lodash from 'lodash';
import { Observable } from 'rxjs';

export interface ISearchContractsFilters {
  type?: ContractType | ContractType[];
  principal_id?: string;
  billed_id?: string;
  supplier_id?: string;
  empty_supplier?: boolean;
  empty_billed?: boolean;
  include_null_supplier?: boolean;
  only_null_supplier?: boolean;
  include_null_billed?: boolean;
  only_null_billed?: boolean;
  include_null_principal?: boolean;
  only_null_principal?: boolean;
  principal_or_billed_id?: string;
  mean_order?: string;
  rolling_vehicles_only?: string;
  activity_code?: string;
  transport_type?: string;
  currency?: string;
  purchase_or_sale?: 'purchase' | 'sale';
  owner_id?: string;
  existing_version_dates?: any;
  product_code?: string;
  center_location?: string;
  wo_grid?: boolean;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContractsHttpService {
  constructor(private http: HttpClient, private config: McitCoreConfig, private env: McitCoreEnv) {}

  getContractVersion(id: string): Observable<IContractVersion> {
    return this.http.get<IContractVersion>(`${this.env.apiUrl}/v2/${this.config.app}/contract-versions/${id}`);
  }

  getContractForPiloting(
    id: string,
    options?: { owner_id?: string; owner_role?: string; supplier_id?: string; fleet_owner_id?: string },
    isCharter2Charter: boolean = false,
    contractType: ContractType = ContractType.TRANSPORT
  ): Observable<IContract> {
    return this.http.get<IContract>(`${this.env.apiUrl}/v2/${this.config.app}/contracts/${id}?isC2C=${isCharter2Charter}&&contract_type=${contractType}`, {
      params: lodash.omitBy(options, lodash.isNil)
    });
  }

  getContract(
    id: string,
    options?: {
      owner_id?: string;
      owner_role?: string;
      supplier_id?: string;
      fleet_owner_id?: string;
      fields?: string;
    },
    isCharter2Charter: boolean = false,
    contractType: ContractType = ContractType.TRSP_ROAD
  ): Observable<IContract> {
    return this.http.get<IContract>(`${this.env.apiUrl}/v2/dispatcher/contracts/${id}?isC2C=${isCharter2Charter}&contract_type=${contractType}`, {
      params: lodash.omitBy(options, lodash.isNil)
    });
  }

  updateContract(contract: IContract, ownerId: string): Observable<string> {
    return this.http.put(`${this.env.apiUrl}/v2/${this.config.app}/contracts/${contract._id}?owner_id=${ownerId}`, contract, {
      responseType: 'text'
    });
  }

  createContract(contract: IContract, ownerId: string): Observable<string> {
    return this.http.post(`${this.env.apiUrl}/v2/${this.config.app}/contracts?owner_id=${ownerId}`, contract, {
      responseType: 'text'
    });
  }

  exportPricingGrid(pricingGrid: IGrid): Observable<HttpResponse<ArrayBuffer>> {
    return this.http.get(`${this.env.apiUrl}/v2/${this.config.app}/contracts/pricing-grid/export`, {
      params: {
        id: pricingGrid._id,
        original_file_name: pricingGrid.file_name
      },
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  exportServicesGrid(servicesGrid: IGrid, isServiceContract: boolean): Observable<HttpResponse<ArrayBuffer>> {
    return this.http.get(`${this.env.apiUrl}/v2/${this.config.app}/contracts/services-grid/export`, {
      params: {
        id: servicesGrid._id,
        original_file_name: servicesGrid.file_name,
        is_service_contract: isServiceContract
      },
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  exportServicesWorkOrdersGrid(servicesGrid: IGrid): Observable<HttpResponse<ArrayBuffer>> {
    return this.http.get(`${this.env.apiUrl}/v2/${this.config.app}/contracts/services-work-orders-grid/export`, {
      params: {
        id: servicesGrid._id,
        original_file_name: servicesGrid.file_name
      },
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  exportContractsGrid(contractsGrid: IGrid): Observable<any> {
    return this.http.get(`${this.env.apiUrl}/v2/${this.config.app}/contracts/contracts-grid/export`, {
      params: {
        id: contractsGrid._id,
        original_file_name: contractsGrid.file_name
      },
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  updateVersion(version: IContractVersion): Observable<string> {
    return this.http.put(`${this.env.apiUrl}/v2/accounting/contract-versions/${version._id}`, version, {
      responseType: 'text'
    });
  }

  search(query: string, page: number, perPage: number, filters: ISearchContractsFilters, sort: string, fields: string): Observable<HttpResponse<IContract[]>> {
    const httpFilter: any = { ...filters };
    return this.http.get<IContract[]>(`${this.env.apiUrl}/v2/accounting/contracts/?q=${query}&page=${page}&per_page=${perPage}&sort=${sort}&fields=${fields}`, {
      params: httpFilter,
      observe: 'response'
    });
  }
}
