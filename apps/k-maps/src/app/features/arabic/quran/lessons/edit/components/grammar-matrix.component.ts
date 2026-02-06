import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type GrammarMatrixRow = {
  concept: string;
  tokenCount: number;
  spanCount: number;
  sentenceCount: number;
};

@Component({
  selector: 'app-grammar-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrap" *ngIf="rows.length; else emptyTpl">
      <table class="editor-table">
        <thead>
          <tr>
            <th>Concept</th>
            <th>Tokens</th>
            <th>Spans</th>
            <th>Sentences</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>{{ row.concept }}</td>
            <td>{{ row.tokenCount }}</td>
            <td>{{ row.spanCount }}</td>
            <td>{{ row.sentenceCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No grammar links yet.</p>
    </ng-template>
  `,
})
export class GrammarMatrixComponent {
  @Input() rows: GrammarMatrixRow[] = [];
}
