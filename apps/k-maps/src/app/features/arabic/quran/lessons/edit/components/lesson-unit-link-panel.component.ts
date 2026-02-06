import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { QuranLessonUnit } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-lesson-unit-link-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="subheading">Current Lesson Units</h3>
    <div class="table-wrap" *ngIf="units.length; else emptyTpl">
      <table class="editor-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Ayah</th>
            <th>Order</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let unit of units; trackBy: trackByUnit">
            <td><code>{{ unit.id }}</code></td>
            <td>{{ unit.unit_type }}</td>
            <td>{{ unit.ayah_from ?? '-' }} - {{ unit.ayah_to ?? '-' }}</td>
            <td>{{ unit.order_index ?? '-' }}</td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(unit.id || '')">
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No units attached yet.</p>
    </ng-template>
  `,
})
export class LessonUnitLinkPanelComponent {
  @Input() units: QuranLessonUnit[] = [];

  @Output() remove = new EventEmitter<string>();

  trackByUnit = (_index: number, unit: QuranLessonUnit) =>
    unit.id || `${unit.unit_type}-${unit.ayah_from}-${unit.ayah_to}-${_index}`;
}
