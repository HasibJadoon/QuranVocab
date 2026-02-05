import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { QuranLessonAyahUnit } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-verse-preview-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verse-preview-compact" *ngIf="verses.length; else emptyTpl">
      <article class="verse-preview-row" *ngFor="let verse of verses; trackBy: trackByVerse">
        <strong class="verse-ref">{{ verse.surah }}:{{ verse.ayah }}</strong>
        <p class="verse-arabic text-arabic" dir="rtl">
          {{ verse.arabic || '—' }}
        </p>
      </article>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">Select a surah + ayah range, then click Load Selection.</p>
    </ng-template>
  `,
  styles: [
    `
      .verse-preview-compact {
        display: grid;
        gap: 0.35rem;
      }

      .verse-preview-row {
        border: 1px solid rgba(126, 157, 214, 0.26);
        border-radius: 9px;
        background: rgba(14, 25, 44, 0.94);
        padding: 0.4rem 0.5rem;
        display: grid;
        grid-template-columns: 60px minmax(0, 1fr);
        align-items: start;
        gap: 0.45rem;
      }

      .verse-ref {
        color: rgba(178, 196, 228, 0.86);
        font-size: 0.73rem;
      }

      .verse-arabic {
        margin: 0;
        line-height: 1.55;
      }
    `,
  ],
})
export class VersePreviewListComponent {
  @Input() verses: QuranLessonAyahUnit[] = [];

  @Output() changed = new EventEmitter<void>();

  trackByVerse = (_index: number, verse: QuranLessonAyahUnit) =>
    verse.unit_id || `${verse.surah}:${verse.ayah}`;
}
