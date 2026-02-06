import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { VerseNavItem } from './lesson-builder.types';

@Component({
  selector: 'app-unit-navigator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="rail">
      <h3>{{ title }}</h3>
      <button
        type="button"
        class="rail-item"
        *ngFor="let verse of verses; trackBy: trackByVerse"
        [class.active]="selectedUnitId === verse.unit_id"
        (click)="select.emit(verse.unit_id)"
      >
        {{ verse.surah }}:{{ verse.ayah }}
      </button>
    </aside>
  `,
})
export class UnitNavigatorComponent {
  @Input() title = 'Verse Units';
  @Input() verses: VerseNavItem[] = [];
  @Input() selectedUnitId = '';

  @Output() select = new EventEmitter<string>();

  trackByVerse = (_index: number, verse: VerseNavItem) => verse.unit_id;
}
