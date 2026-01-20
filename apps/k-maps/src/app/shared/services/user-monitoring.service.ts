import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface UserStateRow {
  user_id: number;
  current_type: string | null;
  current_id: string | null;
  current_unit_id: string | null;
  focus_mode: string | null;
  state_json: string | null;
  updated_at: string;
}

export interface UserActivityRow {
  id: number;
  user_id: number;
  event_type: string;
  target_type: string | null;
  target_id: string | null;
  ref: string | null;
  note: string | null;
  event_json: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserMonitoringService {
  private http = inject(HttpClient);

  listStates() {
    return this.http.get<{ ok: boolean; states: UserStateRow[] }>('/api/user-state');
  }

  listActivity() {
    return this.http.get<{ ok: boolean; logs: UserActivityRow[] }>('/api/user-activity');
  }
}
