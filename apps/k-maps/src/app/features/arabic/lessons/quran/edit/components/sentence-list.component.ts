import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonSentence } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-sentence-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sentence-list" *ngIf="sentences.length; else emptyTpl">
      <article class="sentence-card" *ngFor="let sentence of sentences; trackBy: trackBySentence">
        <header>
          <strong>#{{ sentence.sentence_order ?? '-' }}</strong>
          <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(sentence.sentence_id)">
            Remove
          </button>
        </header>
        <textarea rows="2" class="text-arabic" dir="rtl" [(ngModel)]="sentence.arabic" (ngModelChange)="changed.emit()"></textarea>
        <textarea rows="2" [(ngModel)]="sentence.translation" (ngModelChange)="changed.emit()" placeholder="Translation"></textarea>
      </article>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No sentences for selected verse.</p>
    </ng-template>
  `,
})
export class SentenceListComponent {
  @Input() sentences: QuranLessonSentence[] = [];

  @Output() remove = new EventEmitter<string>();
  @Output() changed = new EventEmitter<void>();

  trackBySentence = (_index: number, sentence: QuranLessonSentence) =>
    sentence.sentence_id ?? `${sentence.unit_id}-${sentence.sentence_order ?? _index}`;
}
