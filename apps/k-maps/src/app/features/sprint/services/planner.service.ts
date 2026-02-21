import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  PlannerTask,
  PlannerTaskRow,
  PlannerWeekPlan,
  PlannerWeekResponse,
  SprintReview,
  SprintReviewRow,
} from '../models/sprint.models';
import { computeWeekStartSydney } from '../utils/week-start.util';
import { resolveApiRoot } from './api-root.util';

type WeekApiResponse = PlannerWeekResponse & { ok: boolean };

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot = resolveApiRoot();

  loadWeek(weekStart: string): Observable<PlannerWeekResponse> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeekApiResponse>(`${this.apiRoot}/planner/week`, { params }).pipe(
      map((response) => this.normalizeWeekResponse(response, weekStart))
    );
  }

  ensureWeek(weekStart: string, title?: string): Observable<PlannerWeekResponse> {
    const payload: Record<string, unknown> = { week_start: weekStart };
    if (title) {
      payload['title'] = title;
    }

    return this.http.post<WeekApiResponse>(`${this.apiRoot}/planner/week`, payload).pipe(
      map((response) => this.normalizeWeekResponse(response, weekStart))
    );
  }

  ensureWeekAnchors(weekStart: string): Observable<PlannerWeekResponse> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.post<WeekApiResponse>(`${this.apiRoot}/week/ensure`, {}, { params }).pipe(
      map((response) => this.normalizeWeekResponse(response, weekStart))
    );
  }

  planWeek(payload: {
    week_start: string;
    planning_state?: {
      is_planned?: boolean;
      defer_until?: string | null;
    };
    later_today?: boolean;
    assignments?: Record<string, unknown>;
  }): Observable<PlannerWeekResponse> {
    return this.http.put<WeekApiResponse>(`${this.apiRoot}/week/plan`, payload).pipe(
      map((response) => this.normalizeWeekResponse(response, payload.week_start))
    );
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

  getTask(taskId: string): Observable<PlannerTaskRow> {
    return this.http.get<{ ok: boolean; task: PlannerTaskRow }>(`${this.apiRoot}/planner/task/${encodeURIComponent(taskId)}`).pipe(
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

  completeTask(taskId: string, payload?: { actual_min?: number; create_capture_note?: boolean }): Observable<{
    task: PlannerTaskRow;
    capture_note: unknown;
  }> {
    return this.http.post<{ ok: boolean; task: PlannerTaskRow; capture_note: unknown }>(
      `${this.apiRoot}/planner/task/${encodeURIComponent(taskId)}/complete`,
      payload ?? {}
    ).pipe(
      map((response) => ({
        task: response.task,
        capture_note: response.capture_note,
      }))
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

  computeCurrentWeekStart(): string {
    return computeWeekStartSydney();
  }

  private normalizeWeekResponse(response: Partial<PlannerWeekResponse>, weekStart: string): PlannerWeekResponse {
    const fallbackWeekPlan: PlannerWeekPlan = {
      schema_version: 1,
      title: `Week Sprint — ${weekStart}`,
      fixed_rhythm: { lessons: 2, podcasts: 3 },
      planning_state: { is_planned: false, planned_at: null, defer_until: null },
      time_budget: {
        lesson_min: 120,
        podcast_min: 135,
        review_min: 30,
        study_minutes: 120,
        podcast_minutes: 135,
        review_minutes: 30,
      },
      intent: 'Learn + produce',
      weekly_goals: [],
      lanes: [
        { key: 'lesson', label: 'Lesson' },
        { key: 'podcast', label: 'Podcast' },
        { key: 'notes', label: 'Notes' },
        { key: 'admin', label: 'Admin' },
      ],
      definition_of_done: [],
      metrics: { tasks_done_target: 5, minutes_target: 285 },
    };

    return {
      ok: true,
      week_start: response.week_start ?? weekStart,
      weekPlan: response.weekPlan ?? null,
      tasks: response.tasks ?? [],
      review: response.review ?? null,
      summary: response.summary ?? {
        tasks_done: 0,
        tasks_total: 0,
        minutes_spent: 0,
        inbox_count: 0,
        capture_notes: 0,
        promoted_notes: 0,
      },
    } as PlannerWeekResponse & { ok: boolean };
  }
}
