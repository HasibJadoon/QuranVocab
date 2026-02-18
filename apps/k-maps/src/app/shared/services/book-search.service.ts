import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './AuthService';
import { API_BASE } from '../api-base';
import type {
  BookSearchChunkHit,
  BookSearchChunkUpdatePayload,
  BookSearchChunkUpdateResponse,
  BookSearchEvidenceHit,
  BookSearchIndexRow,
  BookSearchLexiconEvidence,
  BookSearchPageRow,
  BookSearchReaderResponse,
  BookSearchResponse,
  BookSearchSource,
  BookSearchTocRow,
} from '../models/arabic/book-search.model';
export type {
  BookSearchChunkHit,
  BookSearchChunkUpdatePayload,
  BookSearchChunkUpdateResponse,
  BookSearchEvidenceHit,
  BookSearchIndexRow,
  BookSearchLexiconEvidence,
  BookSearchPageRow,
  BookSearchReaderResponse,
  BookSearchResponse,
  BookSearchSource,
  BookSearchTocRow,
} from '../models/arabic/book-search.model';

type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class BookSearchService {
  private auth = inject(AuthService);
  private readonly baseUrl = `${API_BASE}/ar/book-search`;

  constructor(private readonly http: HttpClient) {}

  listSources(params: {
    q?: string;
    limit?: number;
    offset?: number;
  } = {}): Observable<BookSearchResponse<BookSearchSource>> {
    return this.get<BookSearchSource>({ mode: 'sources', ...params });
  }

  searchChunks(params: {
    q?: string;
    source_code?: string;
    chunk_type?: string;
    page_from?: number;
    page_to?: number;
    heading_norm?: string;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchChunkHit>> {
    return this.get<BookSearchChunkHit>({ mode: 'chunks', ...params });
  }

  listPages(params: {
    source_code?: string;
    page_from?: number;
    page_to?: number;
    heading_norm?: string;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchPageRow>> {
    return this.get<BookSearchPageRow>({ mode: 'pages', ...params });
  }

  listToc(params: {
    source_code?: string;
    q?: string;
    heading_norm?: string;
    page_from?: number;
    page_to?: number;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchTocRow>> {
    return this.get<BookSearchTocRow>({ mode: 'toc', ...params });
  }

  listIndex(params: {
    source_code?: string;
    q?: string;
    heading_norm?: string;
    page_from?: number;
    page_to?: number;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchIndexRow>> {
    return this.get<BookSearchIndexRow>({ mode: 'index', ...params });
  }

  searchEvidence(params: {
    q?: string;
    source_code?: string;
    ar_u_lexicon?: string;
    heading_norm?: string;
    page_from?: number;
    page_to?: number;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchEvidenceHit>> {
    return this.get<BookSearchEvidenceHit>({ mode: 'evidence', ...params });
  }

  listLexiconEvidence(params: {
    ar_u_lexicon: string;
    source_code?: string;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchLexiconEvidence>> {
    return this.get<BookSearchLexiconEvidence>({ mode: 'lexicon', ...params });
  }

  getReaderChunk(params: {
    chunk_id?: string;
    source_code?: string;
    page_no?: number;
  }): Observable<BookSearchReaderResponse> {
    return this.httpGet<BookSearchReaderResponse>({ mode: 'reader', ...params });
  }

  updateChunk(payload: BookSearchChunkUpdatePayload): Observable<BookSearchChunkUpdateResponse> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });
    return this.http.put<BookSearchChunkUpdateResponse>(this.baseUrl, payload, { headers });
  }

  private get<T>(query: Record<string, QueryValue>): Observable<BookSearchResponse<T>> {
    return this.httpGet<BookSearchResponse<T>>(query);
  }

  private httpGet<T>(query: Record<string, QueryValue>): Observable<T> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }

    return this.http.get<T>(this.baseUrl, {
      headers,
      params,
    });
  }
}
