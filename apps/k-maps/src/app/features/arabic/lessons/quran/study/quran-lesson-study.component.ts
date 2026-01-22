import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { QuranLessonService } from '../../../../../shared/services/quran-lesson.service';
import { QuranLesson } from '../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-quran-lesson-study',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quran-lesson-study.component.html',
  styleUrls: ['./quran-lesson-study.component.scss']
})
export class QuranLessonStudyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private service = inject(QuranLessonService);
  private subs = new Subscription();

  private defaultText: QuranLesson['text'] = { arabic_full: [], mode: 'original' };
  lesson: QuranLesson | null = null;

  get arabicParagraph(): string {
    const units = this.lesson?.text?.arabic_full ?? [];
    const cleaned = units
      .map((unit) => unit.arabic?.trim())
      .filter(Boolean) as string[];
    return cleaned.join(' ');
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.subs.add(
        this.service.getLesson(id).subscribe({
          next: (lesson: QuranLesson) =>
            (this.lesson = {
              ...lesson,
              text: lesson.text ?? { ...this.defaultText },
            }),
          error: () => (this.lesson = null),
        })
      );
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
