import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-raw-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="feedback" *ngIf="error">{{ error }}</p>
    <textarea class="json-editor" rows="20" [(ngModel)]="value" name="lessonJsonEditor"></textarea>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" (click)="apply.emit(value)">Apply JSON</button>
    </div>
  `,
})
export class RawJsonEditorComponent {
  @Input() value = '';
  @Input() error = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() apply = new EventEmitter<string>();
}
