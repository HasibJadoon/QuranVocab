import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

type SentenceTreeNode = {
  id: string;
  label: string;
  type: 'clause' | 'phrase' | 'span_ref' | 'token_group';
  tokenRange?: string;
  spanRefs?: string[];
  grammarHints?: string[];
};

type SentenceTreeEdge = {
  from: string;
  to: string;
  label?: string;
};

type SentenceTreeState = {
  nodes: SentenceTreeNode[];
  edges: SentenceTreeEdge[];
};

@Component({
  selector: 'app-sentence-tree-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pane-head">
      <h3>Sentence Tree Builder</h3>
      <button type="button" class="btn btn-sm btn-primary" (click)="addNode.emit()">Add Node</button>
    </div>

    <div class="table-wrap" *ngIf="tree; else emptyTpl">
      <table class="editor-table editor-table--tight">
        <thead>
          <tr>
            <th>Node ID</th>
            <th>Label</th>
            <th>Type</th>
            <th>Token Range</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let node of tree.nodes">
            <td><input type="text" [(ngModel)]="node.id" (ngModelChange)="changed.emit()" /></td>
            <td><input type="text" [(ngModel)]="node.label" (ngModelChange)="changed.emit()" /></td>
            <td>
              <select [(ngModel)]="node.type" (ngModelChange)="changed.emit()">
                <option value="clause">clause</option>
                <option value="phrase">phrase</option>
                <option value="span_ref">span_ref</option>
                <option value="token_group">token_group</option>
              </select>
            </td>
            <td><input type="text" [(ngModel)]="node.tokenRange" (ngModelChange)="changed.emit()" placeholder="0-2" /></td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="removeNode.emit(node.id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="row-actions">
      <button type="button" class="btn btn-sm btn-ghost" (click)="addEdge.emit()">Add Edge</button>
    </div>

    <div class="table-wrap" *ngIf="tree?.edges?.length">
      <table class="editor-table editor-table--tight">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Label</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let edge of tree?.edges; let edgeIndex = index">
            <td><input type="text" [(ngModel)]="edge.from" (ngModelChange)="changed.emit()" /></td>
            <td><input type="text" [(ngModel)]="edge.to" (ngModelChange)="changed.emit()" /></td>
            <td><input type="text" [(ngModel)]="edge.label" (ngModelChange)="changed.emit()" /></td>
            <td>
              <button type="button" class="btn btn-sm btn-danger" (click)="removeEdge.emit(edgeIndex)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyTpl>
      <p class="empty-state">No tree data for selected sentence.</p>
    </ng-template>
  `,
})
export class SentenceTreeCanvasComponent {
  @Input() tree: SentenceTreeState | null = null;

  @Output() addNode = new EventEmitter<void>();
  @Output() removeNode = new EventEmitter<string>();
  @Output() addEdge = new EventEmitter<void>();
  @Output() removeEdge = new EventEmitter<number>();
  @Output() changed = new EventEmitter<void>();
}
