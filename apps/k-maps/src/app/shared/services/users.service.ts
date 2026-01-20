import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface UserPayload {
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
}

export interface UserRow {
  id: number;
  email: string;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_seen_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<{ ok: boolean; users: UserRow[] }>('/api/users');
  }

  create(payload: UserPayload) {
    return this.http.post<{ ok: boolean; user: UserRow }>('/api/users', payload);
  }
}
