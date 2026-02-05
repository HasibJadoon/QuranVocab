import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tab-lock-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state" *ngIf="message">
      <strong>Step locked:</strong> {{ message }}
    </div>
  `,
  styles: [
    `
      .empty-state {
        border: 1px dashed rgba(231, 162, 118, 0.55);
        border-radius: 11px;
        background: rgba(55, 33, 24, 0.3);
        color: rgba(255, 209, 177, 0.94);
        padding: 0.65rem 0.72rem;
        font-size: 0.82rem;
      }
    `,
  ],
})
export class TabLockBannerComponent {
  @Input() message = '';
}
