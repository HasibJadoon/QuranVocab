import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

type SentenceFormModel = {
  text: string;
  translation: string;
  tokens: string;
  spans: string;
  grammarIds: string;
};

@Component({
  selector: 'app-sentence-upsert-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Occurrence Helper</h3>
    <label>
      <span>Sentence text</span>
      <textarea rows="2" [(ngModel)]="form.text"></textarea>
    </label>
    <label>
      <span>Translation</span>
      <textarea rows="2" [(ngModel)]="form.translation"></textarea>
    </label>
    <label>
      <span>Tokens (surface|lexiconId, ...)</span>
      <input type="text" [(ngModel)]="form.tokens" />
    </label>
    <label>
      <span>Spans (text|start-end; ...)</span>
      <input type="text" [(ngModel)]="form.spans" />
    </label>
    <label>
      <span>Grammar IDs</span>
      <input type="text" [(ngModel)]="form.grammarIds" />
    </label>
    <button type="button" class="btn btn-primary" (click)="save.emit()">Save Occurrence</button>
    <p class="feedback" *ngIf="feedback">{{ feedback }}</p>
  `,
})
export class SentenceUpsertActionsComponent {
  @Input() form: SentenceFormModel = {
    text: '',
    translation: '',
    tokens: '',
    spans: '',
    grammarIds: '',
  };
  @Input() feedback = '';

  @Output() save = new EventEmitter<void>();
}
