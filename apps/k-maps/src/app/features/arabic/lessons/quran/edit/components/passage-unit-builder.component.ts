import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-passage-unit-builder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row-actions">
      <button type="button" class="btn btn-ghost" (click)="draftPassage.emit()">
        Draft Passage Unit (Local)
      </button>
      <span class="feedback" *ngIf="unitId">Current unit: <code>{{ unitId }}</code></span>
    </div>
  `,
})
export class PassageUnitBuilderComponent {
  @Input() unitId = '';

  @Output() draftPassage = new EventEmitter<void>();
}
