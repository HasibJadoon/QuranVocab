import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './AuthService';
import { API_BASE } from '../api-base';

export type BookSearchSource = {
  source_code: string;
  title: string;
  author: string | null;
  publication_year: number | null;
  language: string | null;
  type: string;
  chunk_count: number;
};

export type BookSearchChunkHit = {
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  locator: string | null;
  heading_raw: string | null;
  heading_norm: string | null;
  hit: string | null;
  rank: number | null;
};

export type BookSearchEvidenceHit = {
  ar_u_lexicon: string;
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  link_role: string;
  extract_hit: string | null;
  notes_hit: string | null;
  rank: number | null;
};

export type BookSearchLexiconEvidence = {
  source_code: string;
  title: string;
  chunk_id: string;
  page_no: number | null;
  extract_text: string | null;
  notes: string | null;
};

export type BookSearchResponse<T> = {
  ok: boolean;
  mode: 'sources' | 'chunks' | 'evidence' | 'lexicon';
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

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
    page_from?: number;
    page_to?: number;
    heading_norm?: string;
    limit?: number;
    offset?: number;
  }): Observable<BookSearchResponse<BookSearchChunkHit>> {
    return this.get<BookSearchChunkHit>({ mode: 'chunks', ...params });
  }

  searchEvidence(params: {
    q?: string;
    source_code?: string;
    ar_u_lexicon?: string;
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

  private get<T>(query: Record<string, QueryValue>): Observable<BookSearchResponse<T>> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }

    return this.http.get<BookSearchResponse<T>>(this.baseUrl, {
      headers,
      params,
    });
  }
}
