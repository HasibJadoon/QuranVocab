import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonTokenV2 } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-occ-token-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>Tokens</h3>
      <div class="pane-actions">
        <label class="pane-toggle">
          <input
            type="checkbox"
            [checked]="splitAffixes"
            (change)="splitAffixesChange.emit($any($event.target).checked)"
          />
          <span>Split affixes</span>
        </label>
        <button
          type="button"
          class="btn btn-outline-light btn-sm"
          [disabled]="!canLookup || lookupLoading"
          (click)="lookup.emit()"
        >
          {{ lookupLoading ? 'Looking up…' : 'Lookup' }}
        </button>
        <button type="button" class="btn btn-primary btn-sm" (click)="add.emit()">Add Token</button>
      </div>
    </div>

    <div class="table-wrap" *ngIf="tokens.length; else emptyTpl">
      <table class="editor-table editor-table--tokens">
        <thead>
          <tr>
            <th>#</th>
            <th>Surface</th>
            <th>Lemma</th>
            <th>POS</th>
            <th>Index</th>
            <th>Features</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let token of tokens; let index = index; trackBy: trackByToken">
            <td>{{ index + 1 }}</td>
            <td>
              <input
                type="text"
                class="text-arabic"
                dir="rtl"
                [(ngModel)]="token.surface_ar"
                (ngModelChange)="changed.emit(); autoFeatures.emit(token)"
              />
            </td>
            <td>
              <input
                type="text"
                class="text-arabic"
                dir="rtl"
                [(ngModel)]="token.lemma_ar"
                (ngModelChange)="changed.emit(); autoFeatures.emit(token)"
              />
            </td>
            <td>
              <select [(ngModel)]="token.pos" (ngModelChange)="changed.emit(); autoFeatures.emit(token)">
                <option [ngValue]="null">—</option>
                <option *ngFor="let option of posOptions" [ngValue]="option.value">{{ option.label }}</option>
              </select>
            </td>
            <td><input type="number" min="0" [(ngModel)]="token.pos_index" (ngModelChange)="changed.emit()" /></td>
            <td>
              <textarea rows="1" [ngModel]="tokenFeaturesText(token)" (ngModelChange)="tokenFeaturesInput.emit({ token, value: $event })"></textarea>
            </td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(token.token_occ_id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No tokens for selected verse.</p>
    </ng-template>
  `,
})
export class OccTokenGridComponent {
  @Input() tokens: QuranLessonTokenV2[] = [];
  @Input() canLookup = false;
  @Input() lookupLoading = false;
  @Input() splitAffixes = true;

  readonly posOptions = [
    { value: 'noun', label: 'Noun' },
    { value: 'verb', label: 'Verb' },
    { value: 'particle', label: 'Particle' },
    { value: 'adj', label: 'Adjective' },
    { value: 'phrase', label: 'Phrase' },
    { value: 'other', label: 'Other' },
  ];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<string>();
  @Output() changed = new EventEmitter<void>();
  @Output() tokenFeaturesInput = new EventEmitter<{ token: QuranLessonTokenV2; value: string }>();
  @Output() lookup = new EventEmitter<void>();
  @Output() splitAffixesChange = new EventEmitter<boolean>();
  @Output() autoFeatures = new EventEmitter<QuranLessonTokenV2>();

  trackByToken = (_index: number, token: QuranLessonTokenV2) =>
    token.token_occ_id || `${token.unit_id}-${token.pos_index}-${_index}`;

  tokenFeaturesText(token: QuranLessonTokenV2) {
    return token.features ? JSON.stringify(token.features) : '';
  }
}
