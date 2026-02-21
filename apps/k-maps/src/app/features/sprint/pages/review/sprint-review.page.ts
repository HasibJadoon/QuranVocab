import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PlannerTaskRow, SprintReview } from '../../models/sprint.models';
import { PlannerService } from '../../services/planner.service';
import { computeWeekStartSydney, formatWeekRangeLabel } from '../../utils/week-start.util';

@Component({
  selector: 'app-sprint-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sprint-review.page.html',
  styleUrl: './sprint-review.page.scss',
})
export class SprintReviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly planner = inject(PlannerService);

  readonly weekStart = signal<string>(computeWeekStartSydney());
  readonly weekRangeLabel = computed(() => formatWeekRangeLabel(this.weekStart()));
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  readonly tasks = signal<PlannerTaskRow[]>([]);
  reviewDraft: SprintReview = createReviewTemplate(computeWeekStartSydney());
  outcomeLabel = '';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const weekStart = params.get('weekStart') || computeWeekStartSydney();
      const normalized = computeWeekStartSydney(weekStart);
      this.weekStart.set(normalized);
      void this.load(normalized);
    });
  }

  addOutcome(): void {
    const label = this.outcomeLabel.trim();
    if (!label) {
      return;
    }

    this.reviewDraft = {
      ...this.reviewDraft,
      outcomes: [
        ...this.reviewDraft.outcomes,
        {
          label,
          status: 'partial',
        },
      ],
    };
    this.outcomeLabel = '';
  }

  removeOutcome(index: number): void {
    this.reviewDraft = {
      ...this.reviewDraft,
      outcomes: this.reviewDraft.outcomes.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  async submit(): Promise<void> {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);

    try {
      const savedReview = await firstValueFrom(this.planner.upsertReview(this.weekStart(), this.reviewDraft));
      this.reviewDraft = savedReview.item_json;
      this.saved.set(true);
    } catch {
      this.error.set('Could not save sprint review.');
    } finally {
      this.saving.set(false);
    }
  }

  onWorkedChanged(raw: string): void {
    this.reviewDraft = {
      ...this.reviewDraft,
      what_worked: splitLines(raw),
    };
  }

  onBlockedChanged(raw: string): void {
    this.reviewDraft = {
      ...this.reviewDraft,
      what_blocked: splitLines(raw),
    };
  }

  onCarryOverChanged(raw: string): void {
    this.reviewDraft = {
      ...this.reviewDraft,
      carry_over_task_ids: splitLines(raw),
    };
  }

  onNextFocusChanged(raw: string): void {
    this.reviewDraft = {
      ...this.reviewDraft,
      next_week_focus: splitLines(raw),
    };
  }

  workedText(): string {
    return this.reviewDraft.what_worked.join('\n');
  }

  blockedText(): string {
    return this.reviewDraft.what_blocked.join('\n');
  }

  carryOverText(): string {
    return this.reviewDraft.carry_over_task_ids.join('\n');
  }

  nextFocusText(): string {
    return this.reviewDraft.next_week_focus.join('\n');
  }

  markCarryOver(task: PlannerTaskRow): void {
    if (this.reviewDraft.carry_over_task_ids.includes(task.id)) {
      return;
    }

    this.reviewDraft = {
      ...this.reviewDraft,
      carry_over_task_ids: [...this.reviewDraft.carry_over_task_ids, task.id],
    };
  }

  private async load(weekStart: string): Promise<void> {
    this.loading.set(true);
    this.saved.set(false);
    this.error.set(null);

    try {
      const [week, review] = await Promise.all([
        firstValueFrom(this.planner.loadWeek(weekStart)),
        firstValueFrom(this.planner.getReview(weekStart)),
      ]);

      this.tasks.set(week.tasks);
      this.reviewDraft = {
        ...review.item_json,
        title: `Sprint Review — Week of ${weekStart}`,
      };
    } catch {
      this.error.set('Could not load sprint review.');
      this.reviewDraft = createReviewTemplate(weekStart);
    } finally {
      this.loading.set(false);
    }
  }
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function createReviewTemplate(weekStart: string): SprintReview {
  return {
    schema_version: 1,
    title: `Sprint Review — Week of ${weekStart}`,
    outcomes: [],
    metrics: {
      tasks_done: 0,
      tasks_total: 0,
      minutes_spent: 0,
      capture_notes: 0,
      promoted_notes: 0,
    },
    what_worked: [],
    what_blocked: [],
    carry_over_task_ids: [],
    next_week_focus: [],
  };
}
