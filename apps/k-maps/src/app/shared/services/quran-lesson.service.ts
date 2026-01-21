import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { QuranLesson } from '../models/quran-lesson.model';
import { API_BASE } from '../api-base';

@Injectable({
  providedIn: 'root'
})
export class QuranLessonService {
  private readonly baseUrl = `${API_BASE}/arabic/literature/ar_lessons/quran`;

  constructor(private readonly http: HttpClient) {}

  getLesson(id: number | string): Observable<QuranLesson> {
    return this.http
      .get<{ ok: boolean; result: QuranLesson }>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.result));
  }
}
