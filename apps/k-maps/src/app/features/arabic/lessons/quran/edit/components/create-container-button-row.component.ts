import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-create-container-button-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row-actions">
      <button type="button" class="btn btn-primary" (click)="createContainer.emit()">
        Create Container + Units (API)
      </button>
      <button type="button" class="btn btn-ghost" (click)="linkLesson.emit()">
        Link lesson -> container/unit
      </button>
    </div>
  `,
})
export class CreateContainerButtonRowComponent {
  @Output() createContainer = new EventEmitter<void>();
  @Output() linkLesson = new EventEmitter<void>();
}
