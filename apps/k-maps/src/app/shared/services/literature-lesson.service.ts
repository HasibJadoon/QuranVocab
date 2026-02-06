import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { AuthService } from './AuthService';
import { API_BASE } from '../api-base';

export type LiteratureLesson = {
  id?: number;
  title?: string;
  title_ar?: string | null;
  lesson_type?: string;
  subtype?: string | null;
  source?: string | null;
  status?: string | null;
  difficulty?: number | null;
  lesson_json?: Record<string, unknown> | null;
  reference?: Record<string, unknown> | null;
};

export type LiteratureLessonCommitRequest = {
  step: string;
  container_id?: string | null;
  unit_id?: string | null;
  payload: Record<string, unknown>;
};

export type LiteratureLessonDraft = {
  draft_id: string;
  lesson_id?: number | null;
  draft_version: number;
  status?: string;
  active_step?: string | null;
  draft_json: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class LiteratureLessonService {
  private auth = inject(AuthService);
  private readonly baseUrl = `${API_BASE}/ar/literature/lessons`;
  private readonly draftUrl = `${API_BASE}/ar/literature/lesson-drafts`;

  constructor(private readonly http: HttpClient) {}

  getLesson(id: number | string): Observable<LiteratureLesson> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http
      .get<{ ok: boolean; result: LiteratureLesson }>(`${this.baseUrl}/${id}`, { headers })
      .pipe(map((res) => res.result));
  }

  createLesson(payload: LiteratureLesson) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.post<{ ok: boolean; result: LiteratureLesson }>(this.baseUrl, payload, {
      headers,
    });
  }

  updateLesson(id: number | string, payload: LiteratureLesson) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.put<{ ok: boolean; result: LiteratureLesson }>(
      `${this.baseUrl}/${id}`,
      payload,
      { headers }
    );
  }

  commitStep(id: number | string, payload: LiteratureLessonCommitRequest) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.post<{ ok: boolean; result?: Record<string, unknown> }>(
      `${this.baseUrl}/${id}/commit`,
      payload,
      { headers }
    );
  }

  createDraft(payload: { lesson_id?: number; active_step?: string | null }) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http
      .post<{
        ok: boolean;
        draft_id: string;
        lesson_id?: number | null;
        draft_version: number;
        draft_json: Record<string, unknown>;
      }>(this.draftUrl, payload, { headers })
      .pipe(
        map((res) => ({
          draft_id: res.draft_id,
          lesson_id: res.lesson_id ?? null,
          draft_version: res.draft_version,
          draft_json: res.draft_json ?? {},
        }))
      );
  }

  getDraft(draftId: string): Observable<LiteratureLessonDraft> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http
      .get<{
        ok: boolean;
        draft_id: string;
        lesson_id?: number | null;
        draft_version: number;
        status?: string;
        active_step?: string | null;
        draft_json: Record<string, unknown>;
      }>(`${this.draftUrl}/${draftId}`, { headers })
      .pipe(
        map((res) => ({
          draft_id: res.draft_id,
          lesson_id: res.lesson_id ?? null,
          draft_version: res.draft_version,
          status: res.status ?? 'draft',
          active_step: res.active_step ?? null,
          draft_json: res.draft_json ?? {},
        }))
      );
  }

  updateDraft(draftId: string, payload: { draft_json: Record<string, unknown>; active_step?: string | null }) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.put<{ ok: boolean; draft_version: number }>(`${this.draftUrl}/${draftId}`, payload, {
      headers,
    });
  }

  commitDraft(draftId: string, payload: { step: string; draft_version: number }) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.post<{ ok: boolean; lesson_id: number; committed_step: string }>(
      `${this.draftUrl}/${draftId}/commit`,
      payload,
      { headers }
    );
  }

  publishDraft(draftId: string, payload: { draft_version: number }) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.post<{ ok: boolean; lesson_id: number; status: string }>(
      `${this.draftUrl}/${draftId}/publish`,
      payload,
      { headers }
    );
  }
}
