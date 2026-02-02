import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './AuthService';
import {
  QuranLesson,
  QuranLessonSentence,
  QuranLessonApiPayload,
  QuranLessonTokenV2,
  QuranLessonSpanV2,
  QuranLessonVocabBuckets,
  QuranLessonNotes,
  normalizeQuranLessonSentences,
} from '../models/arabic/quran-lesson.model';
import { API_BASE } from '../api-base';

type LessonResponse = QuranLessonApiPayload;

@Injectable({
  providedIn: 'root'
})
export class QuranLessonService {
  private auth = inject(AuthService);
  private readonly baseUrl = `${API_BASE}/arabic/lessons/quran`;

  constructor(private readonly http: HttpClient) {}

  getLesson(id: number | string): Observable<QuranLesson> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http
      .get<{ ok: boolean; result: LessonResponse }>(`${this.baseUrl}/${id}`, { headers })
      .pipe(map((res) => this.mergeLessonPayload(res.result)));
  }

  updateLesson(id: number | string, payload: QuranLesson) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http.put<{ ok: boolean; result: QuranLesson }>(
      `${this.baseUrl}/${id}`,
      payload,
      { headers }
    );
  }

  createLesson(payload: Omit<QuranLesson, 'id'>) {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
    });

    return this.http
      .post<{ ok: boolean; result: QuranLesson }>(this.baseUrl, payload, { headers })
      .pipe(map((res) => res.result));
  }

  private mergeLessonPayload(data: LessonResponse): QuranLesson {
    const lessonJson = (data.lesson_json as Record<string, unknown>) ?? {};
    const ayat = data.ayat ?? [];
    const sentencesPayload = (data.sentences ?? []) as QuranLessonSentence[];
    const normalizedSentences = normalizeQuranLessonSentences(sentencesPayload);
    const text = {
      arabic_full: ayat.map((unit) => ({
        unit_id: unit.unit_id,
        unit_type: unit.unit_type,
        arabic: unit.arabic,
        arabic_diacritics: unit.arabic_diacritics ?? null,
        arabic_non_diacritics: unit.arabic_non_diacritics ?? null,
        translation:
          (unit.translation && typeof unit.translation === 'string'
            ? unit.translation
            : null) ?? null,
        translations:
          unit.translation && typeof unit.translation === 'object' ? unit.translation : null,
        surah: unit.surah,
        ayah: unit.ayah,
        notes: unit.notes ?? null,
      })),
      mode: (lessonJson.mode as 'original' | 'edited' | 'mixed') ?? 'original',
    };

    const lesson: QuranLesson = {
      lesson_type: 'quran',
      id: `${data.lesson_row.id}`,
      title: data.lesson_row.title,
      title_ar: data.lesson_row.title_ar ?? undefined,
      status: data.lesson_row.status,
      difficulty:
        typeof data.lesson_row.difficulty === 'number' ? data.lesson_row.difficulty : undefined,
      reference: lessonJson.reference,
      text,
      sentences: normalizedSentences,
      comprehension: lessonJson.comprehension as QuranLesson['comprehension'],
      vocab_layer: lessonJson.vocab_layer as QuranLesson['vocab_layer'],
      passage_layers: lessonJson.passage_layers as QuranLesson['passage_layers'],
      _notes: lessonJson._notes as QuranLessonNotes,
      created_at: data.lesson_row.created_at,
      updated_at: data.lesson_row.updated_at ?? undefined,
      analysis: {
        tokens: data.tokens as QuranLessonTokenV2[],
        spans: data.spans as QuranLessonSpanV2[],
        vocab: data.vocab as QuranLessonVocabBuckets,
      },
    };
    return lesson;
  }
}
