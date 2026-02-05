import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { PER_PAGE } from '../helpers/pagination.helper';

@Injectable({
  providedIn: 'root'
})
export class McitDocumentsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  get(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/private/documents/${id}`, {
      responseType: 'blob'
    });
  }

  head(id: string): Observable<HttpResponse<Blob>> {
    return this.httpClient.head(`${this.env.apiUrl}/v2/common/private/documents/${id}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  addDocumentForSharing(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post(`${this.env.apiUrl}/v2/common/private/documents/upload-and-share/`, formData, { responseType: 'text' });
  }

  searchDocumentsForSharing(query = '', page = 1, per_page = PER_PAGE, filters: any, sort: string, fields: string): Observable<HttpResponse<any[]>> {
    return this.httpClient.get<any[]>(`${this.env.apiUrl}/v2/common/private/documents/search-documents-for-sharing?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: filters,
      observe: 'response'
    });
  }

  bulkUpdateOnDocumentforSharing(selecteDrivers: string[], selectedSharedDocs: string[]): any {
    return this.httpClient.put(
      `${this.env.apiUrl}/v2/common/private/documents/bulk-share/`,
      {
        drivers: selecteDrivers,
        documents: selectedSharedDocs
      },
      { responseType: 'text' }
    );
  }
}
