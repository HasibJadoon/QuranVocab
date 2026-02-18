import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE } from '../api-base';
import { AuthService } from './AuthService';
import type { BookScrollReaderRangeResponse } from '../models/arabic/book-search.model';

@Injectable({ providedIn: 'root' })
export class BookScrollReaderService {
  private readonly baseUrl = `${API_BASE}/api/books`;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService
  ) {}

  listPagesByRange(params: {
    source_id: string;
    start: number;
    limit: number;
  }): Observable<BookScrollReaderRangeResponse> {
    const sourceId = encodeURIComponent(params.source_id);
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });
    const query = new HttpParams()
      .set('start', String(params.start))
      .set('limit', String(params.limit));

    return this.http.get<BookScrollReaderRangeResponse>(`${this.baseUrl}/${sourceId}/pages`, {
      headers,
      params: query,
    });
  }

  getSinglePage(params: {
    source_id: string;
    page: number;
  }): Observable<BookScrollReaderRangeResponse> {
    const sourceId = encodeURIComponent(params.source_id);
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });
    const query = new HttpParams().set('page', String(params.page));

    return this.http.get<BookScrollReaderRangeResponse>(`${this.baseUrl}/${sourceId}/page`, {
      headers,
      params: query,
    });
  }
}
