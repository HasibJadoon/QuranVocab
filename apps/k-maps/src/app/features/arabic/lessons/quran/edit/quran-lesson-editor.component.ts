import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { QuranLessonService } from '../../../../../shared/services/quran-lesson.service';
import {
  QuranLesson,
  QuranLessonComprehension,
  QuranLessonComprehensionQuestion,
  QuranLessonMcq,
} from '../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-quran-lesson-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quran-lesson-editor.component.html',
})
export class QuranLessonEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(QuranLessonService);

  lesson: QuranLesson | null = null;
  lessonJson = '';
  activeTab: 'arabic' | 'sentences' | 'mcq' | 'comprehension' | 'json' = 'arabic';
  isSaving = false;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.service.getLesson(id).subscribe((lesson: QuranLesson) => {
        const loadedLesson = lesson;
        this.lesson = loadedLesson;
        this.ensureDefaults();
        this.lessonJson = JSON.stringify(this.lesson, null, 2);
      });
    }
  }

  save() {
    if (!this.lesson) return;
    this.applyJsonFields();
    this.isSaving = true;
    this.service.updateLesson(this.lesson.id, this.lesson).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['../view'], { relativeTo: this.route });
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  private applyJsonFields() {
    if (!this.lesson) return;
    try {
      const parsedLesson = JSON.parse(this.lessonJson) as QuranLesson;
      this.lesson = parsedLesson;
      this.ensureDefaults();
      this.lessonJson = JSON.stringify(this.lesson, null, 2);
    } catch {
      // ignore invalid JSON
    }
  }

  private ensureDefaults() {
    if (!this.lesson) return;
    if (!this.lesson.reference) {
      this.lesson.reference = {};
    }
    if (!this.lesson.comprehension) {
      this.lesson.comprehension = {};
    }
    if (!Array.isArray(this.lesson.sentences)) {
      this.lesson.sentences = [];
    }
    if (!this.lesson.text) {
      this.lesson.text = { arabic_full: [], mode: 'original' };
    } else if (!Array.isArray(this.lesson.text.arabic_full)) {
      this.lesson.text.arabic_full = [];
    }
    this.lesson.comprehension.mcqs = this.normalizeMcqs(this.lesson.comprehension);
    if (!Array.isArray(this.lesson.comprehension.reflective)) {
      this.lesson.comprehension.reflective = [];
    }
    if (!Array.isArray(this.lesson.comprehension.analytical)) {
      this.lesson.comprehension.analytical = [];
    }
  }

  private normalizeMcqs(
    value?: QuranLessonComprehension
  ): QuranLessonComprehension['mcqs'] {
    const mcqs = value?.mcqs;
    if (Array.isArray(mcqs)) {
      return mcqs;
    }
    if (mcqs && typeof mcqs === 'object') {
      const typed = mcqs as {
        text?: QuranLessonMcq[];
        vocabulary?: QuranLessonMcq[];
        grammar?: QuranLessonMcq[];
      };
      return {
        text: Array.isArray(typed.text) ? typed.text : [],
        vocabulary: Array.isArray(typed.vocabulary) ? typed.vocabulary : [],
        grammar: Array.isArray(typed.grammar) ? typed.grammar : [],
      };
    }
    return [];
  }

  back() {
    this.router.navigate(['../study'], { relativeTo: this.route });
  }

  get referenceLabel(): string {
    return this.lesson?.reference?.ref_label ?? '';
  }

  set referenceLabel(value: string) {
    if (!this.lesson) return;
    if (!this.lesson.reference) {
      this.lesson.reference = {};
    }
    this.lesson.reference.ref_label = value;
    this.lessonJson = JSON.stringify(this.lesson, null, 2);
  }

  onLessonEdited() {
    if (!this.lesson) return;
    this.lessonJson = JSON.stringify(this.lesson, null, 2);
  }

  get verseList() {
    return (this.lesson?.text.arabic_full ?? [])
      .map((verse) => ({
        id: verse.unit_id,
        text: verse.arabic?.trim() ?? '',
      }))
      .filter((verse) => verse.text);
  }

  get sentenceGroups() {
    const sentences = this.lesson?.sentences ?? [];
    if (!sentences.length) return [];
    const verseMap = new Map(
      (this.lesson?.text.arabic_full ?? []).map((verse) => [
        verse.unit_id,
        { arabic: verse.arabic, surah: verse.surah, ayah: verse.ayah },
      ])
    );

    const groups: Array<{
      unitId: string;
      verseArabic: string;
      surah?: number;
      ayah?: number;
      sentences: Array<{ arabic?: string; translation?: string | null }>;
    }> = [];

    for (const sentence of sentences) {
      const existing = groups.find((group) => group.unitId === sentence.unit_id);
      if (existing) {
        existing.sentences.push({
          arabic: sentence.arabic,
          translation: sentence.translation,
        });
        continue;
      }
      const verseInfo = verseMap.get(sentence.unit_id);
      groups.push({
        unitId: sentence.unit_id,
        verseArabic: verseInfo?.arabic ?? '',
        surah: verseInfo?.surah,
        ayah: verseInfo?.ayah,
        sentences: [
          {
            arabic: sentence.arabic,
            translation: sentence.translation,
          },
        ],
      });
    }

    return groups;
  }

  get mcqQuestions(): QuranLessonMcq[] {
    const mcqs = this.lesson?.comprehension?.mcqs;
    if (!mcqs) return [];
    if (Array.isArray(mcqs)) return mcqs;
    if (typeof mcqs === 'object' && mcqs !== null && 'text' in mcqs) {
      const typed = mcqs as { text?: QuranLessonMcq[] };
      return Array.isArray(typed.text) ? typed.text : [];
    }
    return [];
  }

  get reflectiveQuestions(): QuranLessonComprehensionQuestion[] {
    const questions = this.lesson?.comprehension?.reflective;
    return Array.isArray(questions) ? questions : [];
  }

  get analyticalQuestions(): QuranLessonComprehensionQuestion[] {
    const questions = this.lesson?.comprehension?.analytical;
    return Array.isArray(questions) ? questions : [];
  }

  get hasComprehensionQuestions() {
    return this.reflectiveQuestions.length > 0 || this.analyticalQuestions.length > 0;
  }

  get safeArabicVerses() {
    return this.lesson?.text?.arabic_full ?? [];
  }

  get safeSentences() {
    return this.lesson?.sentences ?? [];
  }

  get safeMcqQuestions(): QuranLessonMcq[] {
    const mcqs = this.lesson?.comprehension?.mcqs;
    if (!mcqs) return [];
    if (Array.isArray(mcqs)) return mcqs;
    if (typeof mcqs === 'object' && mcqs !== null) {
      const typed = mcqs as {
        text?: QuranLessonMcq[];
        vocabulary?: QuranLessonMcq[];
        grammar?: QuranLessonMcq[];
      };
      return [
        ...(Array.isArray(typed.text) ? typed.text : []),
        ...(Array.isArray(typed.vocabulary) ? typed.vocabulary : []),
        ...(Array.isArray(typed.grammar) ? typed.grammar : []),
      ];
    }
    return [];
  }
}
