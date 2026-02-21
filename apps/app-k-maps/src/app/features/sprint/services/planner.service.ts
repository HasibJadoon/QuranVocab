import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PlannerTask, PlannerTaskRow, PlannerWeekResponse, SprintReview, SprintReviewRow } from '../models/sprint.models';
import { computeWeekStartSydney } from '../utils/week-start.util';
import { resolveApiRoot } from './api-root.util';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot = resolveApiRoot();

  loadWeek(weekStart: string): Observable<PlannerWeekResponse> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<PlannerWeekResponse>(`${this.apiRoot}/planner/week`, { params });
  }

  ensureWeek(weekStart: string, title?: string): Observable<PlannerWeekResponse> {
    return this.http.post<PlannerWeekResponse>(`${this.apiRoot}/planner/week`, {
      week_start: weekStart,
      title,
    });
  }

  createTask(payload: {
    week_start: string;
    related_type?: string | null;
    related_id?: string | null;
    item_json: PlannerTask;
  }): Observable<PlannerTaskRow> {
    return this.http.post<{ ok: boolean; task: PlannerTaskRow }>(`${this.apiRoot}/planner/task`, payload).pipe(
      map((response) => response.task)
    );
  }

  updateTask(taskId: string, payload: {
    related_type?: string | null;
    related_id?: string | null;
    item_json: PlannerTask;
  }): Observable<PlannerTaskRow> {
    return this.http.put<{ ok: boolean; task: PlannerTaskRow }>(
      `${this.apiRoot}/planner/task/${encodeURIComponent(taskId)}`,
      payload
    ).pipe(map((response) => response.task));
  }

  getTask(taskId: string): Observable<PlannerTaskRow> {
    return this.http.get<{ ok: boolean; task: PlannerTaskRow }>(`${this.apiRoot}/planner/task/${encodeURIComponent(taskId)}`).pipe(
      map((response) => response.task)
    );
  }

  completeTask(taskId: string, payload?: { actual_min?: number; create_capture_note?: boolean }): Observable<{
    task: PlannerTaskRow;
    capture_note: unknown;
  }> {
    return this.http.post<{ ok: boolean; task: PlannerTaskRow; capture_note: unknown }>(
      `${this.apiRoot}/planner/task/${encodeURIComponent(taskId)}/complete`,
      payload ?? {}
    ).pipe(
      map((response) => ({ task: response.task, capture_note: response.capture_note }))
    );
  }

  getReview(weekStart: string): Observable<SprintReviewRow> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<{ ok: boolean; review: SprintReviewRow }>(`${this.apiRoot}/planner/review`, { params }).pipe(
      map((response) => response.review)
    );
  }

  upsertReview(weekStart: string, itemJson: SprintReview): Observable<SprintReviewRow> {
    return this.http.post<{ ok: boolean; review: SprintReviewRow }>(`${this.apiRoot}/planner/review`, {
      week_start: weekStart,
      item_json: itemJson,
    }).pipe(map((response) => response.review));
  }

  currentWeekStart(): string {
    return computeWeekStartSydney();
  }
}
