import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row-actions">
      <button type="button" class="btn btn-primary" (click)="createAll.emit()">Create all verse units</button>
      <button type="button" class="btn btn-ghost" (click)="fixOrder.emit()">Fix order_index</button>
    </div>
  `,
})
export class BulkActionsComponent {
  @Output() createAll = new EventEmitter<void>();
  @Output() fixOrder = new EventEmitter<void>();
}
