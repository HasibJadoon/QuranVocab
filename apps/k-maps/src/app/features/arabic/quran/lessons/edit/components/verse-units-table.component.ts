import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type VerseUnitRow = {
  surah: number;
  ayah: number;
  unitId: string;
  exists: boolean;
  orderIndex: number | null;
};

@Component({
  selector: 'app-verse-units-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrap" *ngIf="rows.length; else emptyTpl">
      <table class="editor-table">
        <thead>
          <tr>
            <th>Verse</th>
            <th>Unit ID</th>
            <th>Status</th>
            <th>Order</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>{{ row.surah }}:{{ row.ayah }}</td>
            <td><code>{{ row.unitId }}</code></td>
            <td>{{ row.exists ? 'Attached' : 'Missing' }}</td>
            <td>{{ row.orderIndex ?? '-' }}</td>
            <td>
              <button type="button" class="btn btn-sm btn-ghost" (click)="attach.emit(row.ayah)">
                {{ row.exists ? 'Rebuild' : 'Create' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No verse unit rows yet.</p>
    </ng-template>
  `,
})
export class VerseUnitsTableComponent {
  @Input() rows: VerseUnitRow[] = [];

  @Output() attach = new EventEmitter<number>();
}
