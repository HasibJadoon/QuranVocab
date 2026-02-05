import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonAyahUnit } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-verse-preview-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verse-list" *ngIf="verses.length; else emptyTpl">
      <article class="verse-card" *ngFor="let verse of verses; trackBy: trackByVerse">
        <header>
          <strong>{{ verse.surah }}:{{ verse.ayah }}</strong>
          <small>{{ verse.unit_id }}</small>
        </header>

        <textarea
          rows="2"
          class="text-arabic"
          dir="rtl"
          [(ngModel)]="verse.arabic"
          (ngModelChange)="changed.emit()"
          placeholder="Arabic text"
        ></textarea>

        <textarea
          rows="2"
          [(ngModel)]="verse.translation"
          (ngModelChange)="changed.emit()"
          placeholder="Translation"
        ></textarea>
      </article>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">Select a surah + ayah range, then click Load Selection.</p>
    </ng-template>
  `,
})
export class VersePreviewListComponent {
  @Input() verses: QuranLessonAyahUnit[] = [];

  @Output() changed = new EventEmitter<void>();

  trackByVerse = (_index: number, verse: QuranLessonAyahUnit) =>
    verse.unit_id || `${verse.surah}:${verse.ayah}`;
}
