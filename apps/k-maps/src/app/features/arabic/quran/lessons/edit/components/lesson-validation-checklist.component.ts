import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ValidationItem } from './lesson-builder.types';

@Component({
  selector: 'app-lesson-validation-checklist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="review-list">
      <li *ngFor="let item of items; trackBy: trackByItem" [class.ok]="item.ok" [class.bad]="!item.ok">
        <span class="status">{{ item.ok ? 'OK' : 'Fix' }}</span>
        <div>
          <strong>{{ item.label }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </li>
    </ul>
  `,
})
export class LessonValidationChecklistComponent {
  @Input() items: ValidationItem[] = [];

  trackByItem = (_index: number, item: ValidationItem) => item.key;
}
