import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VerseSelection } from './lesson-builder.types';

@Component({
  selector: 'app-verse-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-grid form-grid--selection">
      <label>
        <span>Surah</span>
        <select [(ngModel)]="selection.surah">
          <option *ngFor="let surah of surahOptions" [value]="surah">Surah {{ surah }}</option>
        </select>
      </label>

      <label>
        <span>Ayah from</span>
        <input type="number" min="1" [(ngModel)]="selection.ayahFrom" />
      </label>

      <label>
        <span>Ayah to</span>
        <input type="number" min="1" [(ngModel)]="selection.ayahTo" />
      </label>

      <div class="align-end">
        <button type="button" class="btn btn-primary" (click)="apply.emit()">Load Selection</button>
      </div>
    </div>
  `,
})
export class VerseRangePickerComponent {
  @Input() surahOptions: number[] = [];
  @Input() selection: VerseSelection = { surah: 1, ayahFrom: 1, ayahTo: 7 };

  @Output() apply = new EventEmitter<void>();
}
