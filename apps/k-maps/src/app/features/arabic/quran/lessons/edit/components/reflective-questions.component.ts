import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonComprehensionQuestion } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-reflective-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="content-panel">
      <header class="pane-head">
        <h3>Reflective Questions</h3>
        <button type="button" class="btn btn-primary btn-sm" (click)="add.emit()">Add</button>
      </header>

      <article class="qa-card" *ngFor="let question of questions; let index = index; trackBy: trackByQuestion">
        <div class="pane-head">
          <strong>#{{ index + 1 }}</strong>
          <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(index)">Remove</button>
        </div>
        <textarea rows="2" [(ngModel)]="question.question" (ngModelChange)="changed.emit()"></textarea>
        <textarea rows="2" [(ngModel)]="question.answer_hint" (ngModelChange)="changed.emit()" placeholder="Hint"></textarea>
      </article>
    </section>
  `,
})
export class ReflectiveQuestionsComponent {
  @Input() questions: QuranLessonComprehensionQuestion[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() changed = new EventEmitter<void>();

  trackByQuestion = (_index: number, question: QuranLessonComprehensionQuestion) =>
    question.question_id || `${question.question}-${_index}`;
}
