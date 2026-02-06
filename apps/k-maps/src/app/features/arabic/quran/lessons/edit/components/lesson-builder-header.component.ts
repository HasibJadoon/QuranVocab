import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-lesson-builder-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="builder-header">
      <div class="builder-header-text">
        <p class="builder-kicker">{{ kicker }}</p>
        <div class="builder-title-row">
          <h1>{{ title || fallbackTitle }}</h1>
          <span class="builder-step-chip">Step {{ currentStep }} / {{ totalSteps }}</span>
        </div>
        <p class="builder-intent">{{ intent }}</p>
      </div>

      <div class="builder-actions">
        <button type="button" class="btn btn-ghost" (click)="back.emit()">Back</button>
        <button type="button" class="btn btn-ghost" [disabled]="isNew" (click)="view.emit()">
          View
        </button>
        <button type="button" class="btn btn-primary" [disabled]="isSaving" (click)="save.emit()">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </header>
  `,
  styles: [
    `
      .builder-header {
        border: 1px solid rgba(118, 149, 205, 0.3);
        border-radius: 14px;
        background: linear-gradient(160deg, rgba(15, 24, 43, 0.95), rgba(9, 16, 31, 0.96));
        padding: 0.72rem 0.82rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.7rem;
        flex-wrap: wrap;
      }

      .builder-header-text {
        min-width: 260px;
      }

      .builder-kicker {
        margin: 0;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(171, 192, 229, 0.88);
      }

      .builder-title-row {
        margin-top: 0.15rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      h1 {
        margin: 0;
        font-size: 1.1rem;
        color: rgba(246, 250, 255, 0.98);
      }

      .builder-step-chip {
        border: 1px solid rgba(95, 124, 255, 0.45);
        border-radius: 999px;
        background: rgba(89, 119, 239, 0.2);
        color: rgba(233, 239, 255, 0.96);
        padding: 0.18rem 0.52rem;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
      }

      .builder-intent {
        margin: 0.18rem 0 0;
        font-size: 0.8rem;
        color: rgba(171, 192, 229, 0.88);
      }

      .builder-actions {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .btn {
        border: 1px solid rgba(118, 149, 205, 0.3);
        border-radius: 10px;
        background: rgba(15, 26, 47, 0.92);
        color: rgba(240, 246, 255, 0.96);
        padding: 0.38rem 0.64rem;
        font-size: 0.79rem;
      }

      .btn.btn-primary {
        background: linear-gradient(150deg, #5c71f8, #4a5dea);
        border-color: transparent;
        color: #fff;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @media (max-width: 740px) {
        .builder-header {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class LessonBuilderHeaderComponent {
  @Input() kicker = 'Quran Lesson Builder';
  @Input() title = '';
  @Input() fallbackTitle = 'Untitled lesson';
  @Input() intent = '';
  @Input() isSaving = false;
  @Input() isNew = false;
  @Input() currentStep = 1;
  @Input() totalSteps = 1;

  @Output() back = new EventEmitter<void>();
  @Output() view = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}
