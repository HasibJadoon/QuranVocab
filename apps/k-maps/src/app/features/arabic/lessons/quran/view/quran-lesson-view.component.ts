import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { QuranLessonService } from '../../../../../shared/services/quran-lesson.service';
import {
  QuranLesson,
  QuranLessonAyahUnit,
  QuranLessonMcq,
  QuranLessonSentence,
  QuranLessonUnit,
} from '../../../../../shared/models/arabic/quran-lesson.model';
import { QuranLessonToolbarComponent } from '../toolbar/quran-lesson-toolbar.component';

@Component({
  selector: 'app-quran-lesson-view',
  standalone: true,
  imports: [CommonModule, QuranLessonToolbarComponent],
  templateUrl: './quran-lesson-view.component.html',
  styleUrls: ['./quran-lesson-view.component.scss']
})
export class QuranLessonViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private service = inject(QuranLessonService);
  private subs = new Subscription();

  lesson: QuranLesson | null = null;
  readonly tokenPreviewLimit = 14;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      const sub = this.service
        .getLesson(id)
        .subscribe({
        next: (lesson: QuranLesson) => (this.lesson = lesson),
          error: () => {
            this.lesson = null;
          }
        });
      this.subs.add(sub);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  get lessonTokens() {
    return this.lesson?.analysis?.tokens ?? [];
  }

  get lessonSpans() {
    return this.lesson?.analysis?.spans ?? [];
  }

  get lessonVerbTokens() {
    return this.lesson?.analysis?.vocab?.verbs ?? [];
  }

  get lessonNounTokens() {
    return this.lesson?.analysis?.vocab?.nouns ?? [];
  }

  get lessonSpanBuckets() {
    return this.lesson?.analysis?.vocab?.spans ?? [];
  }

  get tokenPreview() {
    return this.lessonTokens.slice(0, this.tokenPreviewLimit);
  }

  get comprehensionReflective() {
    return this.lesson?.comprehension?.reflective ?? [];
  }

  get comprehensionAnalytical() {
    return this.lesson?.comprehension?.analytical ?? [];
  }

  get comprehensionMcqs(): QuranLessonMcq[] {
    const mcqs = this.lesson?.comprehension?.mcqs;
    if (!mcqs) return [];
    if (Array.isArray(mcqs)) return mcqs;
    return [...(mcqs.text ?? []), ...(mcqs.vocabulary ?? []), ...(mcqs.grammar ?? [])];
  }

  get hasExtendedBlocks() {
    return !!(
      this.lesson?._notes ||
      this.lesson?.vocab_layer ||
      this.lesson?.passage_layers?.length
    );
  }

  get referenceRangeLabel() {
    const ref = this.lesson?.reference;
    if (!ref?.surah || !ref?.ayah_from) return '—';
    if (!ref.ayah_to || ref.ayah_to === ref.ayah_from) {
      return `${ref.surah}:${ref.ayah_from}`;
    }
    return `${ref.surah}:${ref.ayah_from}-${ref.ayah_to}`;
  }

  get sourceLabel() {
    return this.lesson?.reference?.source_type ?? 'quran';
  }

  get sentenceCount() {
    return this.lesson?.sentences?.length ?? 0;
  }

  get unitCount() {
    return this.lesson?.units?.length ?? 0;
  }

  get ayahCount() {
    return this.lesson?.text?.arabic_full?.length ?? 0;
  }

  get modeLabel() {
    return this.lesson?.text?.mode ?? 'original';
  }

  trackByAyah = (_index: number, ayah: QuranLessonAyahUnit) =>
    ayah.unit_id || `${ayah.surah}:${ayah.ayah}`;

  trackBySentence = (_index: number, sentence: QuranLessonSentence) =>
    sentence.sentence_id ?? `${sentence.unit_id}-${sentence.sentence_order ?? 0}`;

  trackByUnit = (_index: number, unit: QuranLessonUnit) => unit.id ?? `${unit.order_index ?? _index}`;

  trackByToken = (_index: number, token: { token_occ_id: string }) => token.token_occ_id;

  trackById = (_index: number, item: { question_id?: string; mcq_id?: string; word?: string; u_span_id?: string }) =>
    item.question_id ?? item.mcq_id ?? item.word ?? item.u_span_id ?? `${_index}`;
}
