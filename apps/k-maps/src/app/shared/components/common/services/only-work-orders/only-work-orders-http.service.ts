import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { McitCoreEnv } from '../../helpers/provider.helper';
import { IOnlyWorkOrder, IWorkOrderContractRequest, IWorkOrderFromGrid } from '../../models/only-work-order.model';
import { IWorkOrderContractResult } from '@business-fvl/models/work-order-contract-pricing.model';

@Injectable({
  providedIn: 'root'
})
export class OnlyWorkOrdersHttpService {
  url: string;

  constructor(private environment: McitCoreEnv, private httpClient: HttpClient) {
    this.url = `${this.environment.apiUrl}/v2/fvl/only-work-orders`;
  }

  get(id: string, fields?: string): Observable<IOnlyWorkOrder> {
    if (fields) {
      return this.httpClient.get<IOnlyWorkOrder>(`${this.url}/${id}?fields=${fields}`);
    } else {
      return this.httpClient.get<IOnlyWorkOrder>(`${this.url}/${id}`);
    }
  }

  getByNos(workOrdersNos: string[], projection: any): Observable<IOnlyWorkOrder[]> {
    return this.httpClient.post<IOnlyWorkOrder[]>(`${this.url}/multiple-by-nos`, {
      nos: workOrdersNos,
      projection: projection ?? []
    });
  }

  search(query: string, page: number, per_page: number, filters: any, sort: string, fields: string): Observable<HttpResponse<IOnlyWorkOrder[]>> {
    return this.httpClient.post<IOnlyWorkOrder[]>(`${this.url}/search?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, filters, {
      observe: 'response'
    });
  }

  getAll(query: string, filters: any, sort: string, fields: string): Observable<IOnlyWorkOrder[]> {
    return this.httpClient.post<IOnlyWorkOrder[]>(`${this.url}/all`, { ...filters, q: query, sort: sort, fields: fields });
  }

  public excelExport(query: string | undefined, filters: any, exportDetails?: boolean): Observable<HttpResponse<Blob>> {
    return this.httpClient
      .post(
        `${this.url}/export-excel`,
        { ...filters, export_details: exportDetails ?? false, q: query },
        {
          responseType: 'blob',
          observe: 'response'
        }
      )
      .pipe(
        tap((response: HttpResponse<Blob>) => {
          if (!response || !response.body) {
            return;
          }
          const a = document.createElement('a');
          a.href = window.URL.createObjectURL(response.body);
          a.download = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/.exec(response.headers.get('content-disposition'))[1] ?? 'work-orders.xlsx';
          a.target = '_blank';
          a.click();
          a.remove();
        })
      );
  }

  searchWorkOrdersContractFromFvl(workOrderContractRequest: IWorkOrderContractRequest): Observable<IWorkOrderFromGrid[]> {
    return this.httpClient.post<IWorkOrderFromGrid[]>(`${this.url}/search-work-orders-contract-from-fvl`, workOrderContractRequest);
  }

  valuateDraftWorkOrder(workOrderContractRequest: IWorkOrderContractRequest): Observable<IWorkOrderContractResult | undefined> {
    return this.httpClient.post<IWorkOrderContractResult | undefined>(`${this.url}/valuate-draft-work-order`, workOrderContractRequest);
  }
}
