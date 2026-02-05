import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dirty-state-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="builder-stepper">
      <button type="button" class="btn btn-ghost" [disabled]="!canPrev" (click)="prev.emit()">
        Previous
      </button>
      <span class="step-indicator">Step {{ currentStep }} / {{ totalSteps }}</span>
      <button type="button" class="btn btn-ghost" [disabled]="!canNext" (click)="next.emit()">
        Next
      </button>
    </div>
  `,
  styles: [
    `
      .builder-stepper {
        border: 1px solid rgba(118, 149, 205, 0.28);
        border-radius: 12px;
        background: rgba(10, 18, 33, 0.94);
        padding: 0.42rem 0.58rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }

      .step-indicator {
        border: 1px solid rgba(118, 149, 205, 0.34);
        border-radius: 999px;
        padding: 0.16rem 0.52rem;
        font-size: 0.72rem;
        color: rgba(184, 202, 235, 0.9);
      }

      .btn {
        border: 1px solid rgba(118, 149, 205, 0.34);
        border-radius: 9px;
        background: rgba(14, 24, 42, 0.95);
        color: rgba(240, 246, 255, 0.96);
        padding: 0.3rem 0.6rem;
        font-size: 0.77rem;
      }

      .btn:disabled {
        opacity: 0.58;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .builder-stepper {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class DirtyStateBarComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 1;
  @Input() canPrev = false;
  @Input() canNext = false;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
