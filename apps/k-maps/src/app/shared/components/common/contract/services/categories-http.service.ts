import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICategory } from '@lib-shared/common/models/category.model';
import { IContract, IGrid } from '@lib-shared/common/contract/contract.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';

@Injectable({
  providedIn: 'root'
})
export class CategoriesHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv, private config: McitCoreConfig) {}

  search(query: string, ownerId: string, page: number, per_page: number, sort: string, fields: string): Observable<HttpResponse<ICategory[]>> {
    return this.httpClient.get<ICategory[]>(`${this.env.apiUrl}/v2/${this.config.app}/categories/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: ownerId ? { owner_id: ownerId } : null,
      observe: 'response'
    });
  }

  get(id: string, ownerId: string): Observable<ICategory> {
    return this.httpClient.get<ICategory>(`${this.env.apiUrl}/v2/${this.config.app}/categories/${id}`, {
      params: ownerId ? { owner_id: ownerId } : null
    });
  }

  update(category: ICategory, ownerId: string): Observable<string> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/${this.config.app}/categories/${category._id}`, category, {
      params: { owner_id: ownerId },
      responseType: 'text'
    });
  }

  create(category: ICategory, ownerId: string): Observable<string> {
    return this.httpClient.post(`${this.env.apiUrl}/v2/${this.config.app}/categories`, category, {
      params: { owner_id: ownerId },
      responseType: 'text'
    });
  }

  delete(category: ICategory, ownerId: string): Observable<string> {
    return this.httpClient.delete(`${this.env.apiUrl}/v2/${this.config.app}/categories/${category._id}`, {
      params: { owner_id: ownerId },
      responseType: 'text'
    });
  }

  checkCsv(resourceId: string, ownerId: string) {
    return this.httpClient.get<IContract[]>(`${this.env.apiUrl}/v2/${this.config.app}/categories/categories-grid/check?file_id=${resourceId}`, {
      params: { owner_id: ownerId },
      observe: 'response'
    });
  }

  importCsv(resourceId: string, ownerId: string): Observable<HttpResponse<IGrid>> {
    return this.httpClient.get<IGrid>(`${this.env.apiUrl}/v2/${this.config.app}/categories/categories-grid/import?file_id=${resourceId}`, {
      headers: {
        'use-skipper': 'disabled'
      },
      params: { owner_id: ownerId },
      observe: 'response'
    });
  }

  getApiUploadGridEndPoint(ownerId: string) {
    return `${this.env.apiUrl}/v2/${this.config.app}/categories/categories-grid/upload`;
  }

  exportCategoriesGrid(ownerId: string): Observable<HttpResponse<ArrayBuffer>> {
    return this.httpClient.put(
      `${this.env.apiUrl}/v2/${this.config.app}/categories/categories-grid/export`,
      {},
      {
        params: { owner_id: ownerId },
        observe: 'response',
        responseType: 'arraybuffer'
      }
    );
  }
}
