import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { BuilderTab, BuilderTabId, BuilderTabState } from './lesson-builder.types';

@Component({
  selector: 'app-lesson-builder-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="builder-workflow"
      [class.mode-strip]="layout === 'strip'"
      [class.mode-rail]="layout === 'rail'"
      role="tablist"
      aria-label="Lesson builder workflow tabs"
    >
      <article
        *ngFor="let tab of tabs; let index = index; trackBy: trackByTab"
        class="workflow-step"
        [class.is-active]="stateOf(tab.id) === 'active'"
        [class.is-done]="stateOf(tab.id) === 'done'"
        [class.is-ready]="stateOf(tab.id) === 'ready'"
        [class.is-locked]="stateOf(tab.id) === 'locked'"
        [class.is-error]="stateOf(tab.id) === 'error'"
      >
        <button
          type="button"
          class="workflow-step-main"
          [disabled]="isLocked(tab.id)"
          [attr.title]="lockReason(tab.id) || null"
          [attr.aria-current]="activeTabId === tab.id ? 'step' : null"
          (click)="onTabClick(tab.id)"
        >
          <span class="workflow-glyph">{{ glyphOf(tab.id, index) }}</span>

          <span class="workflow-text">
            <span class="workflow-label">{{ tab.label }}</span>
            <small class="workflow-intent" *ngIf="layout !== 'strip'">{{ tab.intent }}</small>
          </span>

          <span class="workflow-state">{{ statusLabel(stateOf(tab.id)) }}</span>
        </button>

        <p class="workflow-lock-hint" *ngIf="isLocked(tab.id) && layout !== 'strip'">
          {{ lockReason(tab.id) }}
        </p>
      </article>
    </nav>
  `,
  styles: [
    `
      .builder-workflow {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.5rem;
      }

      .workflow-step {
        border: 1px solid rgba(118, 149, 205, 0.28);
        border-radius: 12px;
        background: linear-gradient(165deg, rgba(17, 28, 48, 0.92), rgba(10, 19, 34, 0.94));
      }

      .workflow-step-main {
        width: 100%;
        border: 0;
        background: transparent;
        color: rgba(240, 246, 255, 0.96);
        display: grid;
        grid-template-columns: 26px 1fr auto;
        gap: 0.55rem;
        align-items: center;
        text-align: left;
        padding: 0.56rem 0.62rem;
      }

      .workflow-glyph {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: inline-grid;
        place-items: center;
        border: 1px solid rgba(134, 165, 224, 0.52);
        color: rgba(214, 227, 253, 0.98);
        font-size: 0.78rem;
        font-weight: 700;
      }

      .workflow-text {
        min-width: 0;
        display: grid;
        gap: 0.1rem;
      }

      .workflow-label {
        font-size: 0.84rem;
        line-height: 1.2;
      }

      .workflow-intent {
        color: rgba(167, 186, 221, 0.84);
        font-size: 0.71rem;
        line-height: 1.25;
      }

      .workflow-state {
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(164, 184, 220, 0.88);
      }

      .workflow-lock-hint {
        margin: 0 0.62rem 0.5rem 2.18rem;
        font-size: 0.7rem;
        color: rgba(244, 176, 120, 0.92);
      }

      .workflow-step.is-active {
        border-color: rgba(96, 124, 255, 0.64);
        box-shadow: inset 0 0 0 1px rgba(96, 124, 255, 0.3);
      }

      .workflow-step.is-active .workflow-glyph {
        border-color: rgba(109, 140, 255, 0.95);
        color: rgba(236, 241, 255, 0.98);
        background: rgba(89, 118, 240, 0.26);
      }

      .workflow-step.is-done .workflow-glyph {
        border-color: rgba(108, 215, 169, 0.95);
        color: rgba(198, 255, 228, 0.96);
        background: rgba(51, 157, 115, 0.22);
      }

      .workflow-step.is-ready .workflow-glyph {
        border-color: rgba(214, 175, 88, 0.95);
        color: rgba(255, 234, 188, 0.95);
      }

      .workflow-step.is-error .workflow-glyph {
        border-color: rgba(246, 138, 138, 0.95);
        color: rgba(255, 205, 205, 0.96);
      }

      .workflow-step.is-locked {
        opacity: 0.85;
      }

      .workflow-step.is-locked .workflow-step-main {
        cursor: not-allowed;
      }

      .workflow-step.is-locked .workflow-glyph {
        border-color: rgba(218, 152, 159, 0.62);
        color: rgba(241, 187, 194, 0.9);
      }

      .workflow-step-main:disabled {
        pointer-events: none;
      }

      @media (max-width: 860px) {
        .builder-workflow {
          grid-template-columns: 1fr;
        }
      }

      .builder-workflow.mode-strip {
        display: flex;
        gap: 0.45rem;
        overflow-x: auto;
        padding: 0.1rem 0.05rem 0.22rem;
      }

      .builder-workflow.mode-strip .workflow-step {
        min-width: 226px;
      }

      .builder-workflow.mode-strip .workflow-step-main {
        padding: 0.48rem 0.58rem;
      }

      .builder-workflow.mode-strip .workflow-label {
        font-size: 0.8rem;
      }

      .builder-workflow.mode-strip .workflow-state {
        font-size: 0.62rem;
      }

      .builder-workflow.mode-rail {
        grid-template-columns: 1fr;
        gap: 0.58rem;
        padding-left: 0.96rem;
        position: relative;
      }

      .builder-workflow.mode-rail::before {
        content: '';
        position: absolute;
        left: 0.35rem;
        top: 0.28rem;
        bottom: 0.28rem;
        width: 1px;
        background: linear-gradient(
          180deg,
          rgba(106, 148, 255, 0.62),
          rgba(105, 130, 176, 0.14)
        );
      }

      .builder-workflow.mode-rail .workflow-step {
        position: relative;
      }

      .builder-workflow.mode-rail .workflow-step::before {
        content: '';
        position: absolute;
        left: -0.8rem;
        top: 1.06rem;
        width: 0.52rem;
        height: 1px;
        background: rgba(106, 148, 255, 0.58);
      }

      .builder-workflow.mode-rail .workflow-step-main {
        padding: 0.55rem 0.62rem;
      }

      .builder-workflow.mode-rail .workflow-label {
        font-size: 0.91rem;
      }

      .builder-workflow.mode-rail .workflow-state {
        min-width: 52px;
        text-align: right;
      }
    `,
  ],
})
export class LessonBuilderTabsComponent {
  @Input() tabs: BuilderTab[] = [];
  @Input() activeTabId: BuilderTabId = 'meta';
  @Input() lockedTabs: Partial<Record<BuilderTabId, string>> = {};
  @Input() statuses: Partial<Record<BuilderTabId, BuilderTabState>> = {};
  @Input() layout: 'grid' | 'strip' | 'rail' = 'grid';

  @Output() tabChange = new EventEmitter<BuilderTabId>();

  trackByTab = (_index: number, tab: BuilderTab) => tab.id;

  isLocked(tabId: BuilderTabId) {
    return !!this.lockedTabs[tabId];
  }

  lockReason(tabId: BuilderTabId) {
    return this.lockedTabs[tabId] ?? '';
  }

  stateOf(tabId: BuilderTabId): BuilderTabState {
    if (this.activeTabId === tabId) return 'active';
    if (this.lockedTabs[tabId]) return 'locked';
    return this.statuses[tabId] ?? 'todo';
  }

  glyphOf(tabId: BuilderTabId, index: number) {
    const state = this.stateOf(tabId);
    switch (state) {
      case 'done':
        return 'OK';
      case 'ready':
        return '>';
      case 'error':
        return '!';
      case 'locked':
        return 'L';
      case 'active':
        return String(index + 1);
      default:
        return '.';
    }
  }

  statusLabel(state: BuilderTabState) {
    switch (state) {
      case 'active':
        return 'active';
      case 'done':
        return 'done';
      case 'ready':
        return 'ready';
      case 'locked':
        return 'locked';
      case 'error':
        return 'error';
      default:
        return 'todo';
    }
  }

  onTabClick(tabId: BuilderTabId) {
    if (this.isLocked(tabId)) return;
    this.tabChange.emit(tabId);
  }
}
