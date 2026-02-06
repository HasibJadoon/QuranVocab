import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuranLessonSpanV2 } from '../../../../../../shared/models/arabic/quran-lesson.model';

@Component({
  selector: 'app-span-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>Span Builder</h3>
      <button type="button" class="btn btn-primary btn-sm" (click)="add.emit()">Add Span</button>
    </div>

    <div class="table-wrap" *ngIf="spans.length; else emptyTpl">
      <table class="editor-table">
        <thead>
          <tr>
            <th>Span ID</th>
            <th>Text</th>
            <th>Start</th>
            <th>End</th>
            <th>Token IDs</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let span of spans; trackBy: trackBySpan">
            <td><input type="text" [(ngModel)]="span.u_span_id" (ngModelChange)="changed.emit()" /></td>
            <td><input type="text" [(ngModel)]="span.text_cache" (ngModelChange)="changed.emit()" /></td>
            <td><input type="number" min="0" [(ngModel)]="span.start_index" (ngModelChange)="changed.emit()" /></td>
            <td><input type="number" min="0" [(ngModel)]="span.end_index" (ngModelChange)="changed.emit()" /></td>
            <td>
              <input
                type="text"
                [ngModel]="spanTokenIdsText(span)"
                (ngModelChange)="tokenIdsInput.emit({ span, value: $event })"
              />
            </td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="remove.emit(span.span_occ_id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No spans for selected verse.</p>
    </ng-template>
  `,
})
export class SpanBuilderComponent {
  @Input() spans: QuranLessonSpanV2[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<string>();
  @Output() changed = new EventEmitter<void>();
  @Output() tokenIdsInput = new EventEmitter<{ span: QuranLessonSpanV2; value: string }>();

  trackBySpan = (_index: number, span: QuranLessonSpanV2) =>
    span.span_occ_id || `${span.unit_id}-${span.start_index}-${span.end_index}-${_index}`;

  spanTokenIdsText(span: QuranLessonSpanV2) {
    return (span.token_ids ?? []).join(', ');
  }
}
