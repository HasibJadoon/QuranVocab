import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLesson } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-lesson-meta-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-grid form-grid--meta" *ngIf="lesson as lessonData">
      <label>
        <span>Title</span>
        <input type="text" [(ngModel)]="lessonData.title" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Arabic title</span>
        <input
          type="text"
          dir="rtl"
          class="text-arabic"
          [(ngModel)]="lessonData.title_ar"
          (ngModelChange)="changed.emit()"
        />
      </label>

      <label>
        <span>Status</span>
        <input type="text" [(ngModel)]="lessonData.status" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Subtype</span>
        <input type="text" [(ngModel)]="lessonData.subtype" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Difficulty</span>
        <input type="number" min="1" [(ngModel)]="lessonData.difficulty" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Source</span>
        <input type="text" [(ngModel)]="lessonData.source" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Reference label</span>
        <input type="text" [(ngModel)]="reference.ref_label" (ngModelChange)="changed.emit()" />
      </label>

      <label>
        <span>Citation</span>
        <input type="text" [(ngModel)]="reference.citation" (ngModelChange)="changed.emit()" />
      </label>
    </div>
  `,
})
export class LessonMetaFormComponent {
  @Input() lesson: QuranLesson | null = null;
  @Input() reference: NonNullable<QuranLesson['reference']> = {};

  @Output() changed = new EventEmitter<void>();
}
