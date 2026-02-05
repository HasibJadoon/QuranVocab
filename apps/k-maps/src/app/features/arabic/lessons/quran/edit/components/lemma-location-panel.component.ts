import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonLemmaLocation } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-lemma-location-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>Lemma Locations</h3>
      <button type="button" class="btn btn-sm btn-primary" (click)="add.emit()">Add</button>
    </div>

    <div class="table-wrap" *ngIf="lemmas.length; else emptyTpl">
      <table class="editor-table editor-table--tight">
        <thead>
          <tr>
            <th>Lemma</th>
            <th>Loc</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let lemma of lemmas; let index = index; trackBy: trackByLemma">
            <td>
              <input
                type="text"
                class="text-arabic"
                dir="rtl"
                [(ngModel)]="lemma.lemma_text"
                (ngModelChange)="changed.emit()"
              />
            </td>
            <td>
              <input type="text" [(ngModel)]="lemma.word_location" (ngModelChange)="changed.emit()" />
            </td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(index)">X</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No lemma locations for this verse.</p>
    </ng-template>
  `,
})
export class LemmaLocationPanelComponent {
  @Input() lemmas: QuranLessonLemmaLocation[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() changed = new EventEmitter<void>();

  trackByLemma = (_index: number, lemma: QuranLessonLemmaLocation) =>
    `${lemma.lemma_id}-${lemma.word_location}-${lemma.token_index}-${_index}`;
}
