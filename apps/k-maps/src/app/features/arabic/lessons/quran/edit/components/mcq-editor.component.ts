import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonMcq } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-mcq-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="content-panel">
      <header class="pane-head">
        <h3>MCQs</h3>
        <button type="button" class="btn btn-primary btn-sm" (click)="addQuestion.emit()">Add MCQ</button>
      </header>

      <article class="mcq-card" *ngFor="let mcq of questions; let questionIndex = index; trackBy: trackByMcq">
        <div class="pane-head">
          <strong>Question {{ questionIndex + 1 }}</strong>
          <button type="button" class="btn btn-sm btn-danger" (click)="removeQuestion.emit(questionIndex)">Remove</button>
        </div>
        <textarea rows="2" [(ngModel)]="mcq.question" (ngModelChange)="changed.emit()"></textarea>

        <div class="option-row" *ngFor="let option of mcq.options; let optionIndex = index">
          <label class="check-inline">
            <input type="checkbox" [(ngModel)]="option.is_correct" (ngModelChange)="changed.emit()" />
            Correct
          </label>
          <textarea rows="1" [(ngModel)]="option.option" (ngModelChange)="changed.emit()"></textarea>
          <button type="button" class="btn btn-sm btn-danger" (click)="removeOption.emit({ question: mcq, index: optionIndex })">X</button>
        </div>

        <button type="button" class="btn btn-sm btn-ghost" (click)="addOption.emit(mcq)">Add Option</button>
      </article>
    </section>
  `,
})
export class McqEditorComponent {
  @Input() questions: QuranLessonMcq[] = [];

  @Output() addQuestion = new EventEmitter<void>();
  @Output() removeQuestion = new EventEmitter<number>();
  @Output() addOption = new EventEmitter<QuranLessonMcq>();
  @Output() removeOption = new EventEmitter<{ question: QuranLessonMcq; index: number }>();
  @Output() changed = new EventEmitter<void>();

  trackByMcq = (_index: number, mcq: QuranLessonMcq) =>
    mcq.mcq_id || `${mcq.question}-${_index}`;
}
