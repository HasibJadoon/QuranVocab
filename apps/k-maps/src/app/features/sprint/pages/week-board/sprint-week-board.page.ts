import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  CaptureNote,
  CaptureNoteMeta,
  PlannerLane,
  PlannerPriority,
  PlannerTask,
  PlannerTaskRow,
  PlannerTaskStatus,
  PlannerWeekPlan,
  PlannerWeekSummary,
  UserFocusState,
} from '../../models/sprint.models';
import { CaptureNotesService } from '../../services/capture-notes.service';
import { PlannerService } from '../../services/planner.service';
import { UserStateService } from '../../services/user-state.service';
import { addDaysIso, computeWeekStartSydney, formatWeekRangeLabel } from '../../utils/week-start.util';

@Component({
  selector: 'app-sprint-week-board-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sprint-week-board.page.html',
  styleUrl: './sprint-week-board.page.scss',
})
export class SprintWeekBoardPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planner = inject(PlannerService);
  private readonly captureNotes = inject(CaptureNotesService);
  private readonly userState = inject(UserStateService);

  readonly weekStart = signal<string>(computeWeekStartSydney());
  readonly weekPlan = signal<PlannerWeekPlan | null>(null);
  readonly tasks = signal<PlannerTaskRow[]>([]);
  readonly summary = signal<PlannerWeekSummary>({
    tasks_done: 0,
    tasks_total: 0,
    minutes_spent: 0,
    inbox_count: 0,
    capture_notes: 0,
    promoted_notes: 0,
  });
  readonly focusState = signal<UserFocusState | null>(null);
  readonly inboxNotes = signal<CaptureNote[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly quickCaptureControl = new FormControl('', { nonNullable: true });
  readonly quickTaskControl = new FormControl('', { nonNullable: true });
  readonly checklistInputControl = new FormControl('', { nonNullable: true });

  readonly drawerOpen = signal(false);
  readonly selectedTaskId = signal<string | null>(null);

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];
  readonly priorities: PlannerPriority[] = ['P1', 'P2', 'P3'];
  readonly statuses: PlannerTaskStatus[] = ['todo', 'doing', 'done', 'blocked'];

  taskDraft: PlannerTask | null = null;
  taskRelatedType = '';
  taskRelatedId = '';
  taskSource: PlannerTaskRow | null = null;

  readonly weekRangeLabel = computed(() => {
    return formatWeekRangeLabel(this.weekStart());
  });

  readonly progressPct = computed(() => {
    const current = this.summary();
    if (!current.tasks_total) {
      return 0;
    }
    return Math.min(100, Math.round((current.tasks_done / current.tasks_total) * 100));
  });

  readonly timePct = computed(() => {
    const plan = this.weekPlan();
    const current = this.summary();
    const target = plan?.metrics.minutes_target ?? 0;
    if (!target) {
      return 0;
    }
    return Math.min(100, Math.round((current.minutes_spent / target) * 100));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadFromParams(params);
    });
  }

  tasksForLane(lane: PlannerLane): PlannerTaskRow[] {
    return this.tasks()
      .filter((task) => task.item_json.lane === lane)
      .sort((a, b) => {
        const updatedA = new Date(a.updated_at ?? a.created_at).getTime();
        const updatedB = new Date(b.updated_at ?? b.created_at).getTime();
        return updatedB - updatedA;
      });
  }

  onDragStart(event: DragEvent, taskId: string): void {
    if (!event.dataTransfer) {
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/task-id', taskId);
  }

  onLaneDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onLaneDrop(event: DragEvent, lane: PlannerLane): void {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/task-id');
    if (!taskId) {
      return;
    }

    const row = this.tasks().find((item) => item.id === taskId);
    if (!row || row.item_json.lane === lane) {
      return;
    }

    const patched: PlannerTask = {
      ...row.item_json,
      lane,
    };

    void this.saveExistingTask(row, patched, row.related_type, row.related_id);
  }

  openTask(task: PlannerTaskRow): void {
    this.taskSource = task;
    this.selectedTaskId.set(task.id);
    this.taskDraft = structuredClone(task.item_json);
    this.taskRelatedType = task.related_type ?? '';
    this.taskRelatedId = task.related_id ?? '';
    this.checklistInputControl.setValue('', { emitEvent: false });
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedTaskId.set(null);
    this.taskSource = null;
    this.taskDraft = null;
    this.taskRelatedType = '';
    this.taskRelatedId = '';
  }

  startCreateTask(): void {
    const title = this.quickTaskControl.value.trim() || 'New task';
    this.taskSource = null;
    this.selectedTaskId.set(null);
    this.taskDraft = createTaskTemplate(title);
    this.taskRelatedType = '';
    this.taskRelatedId = '';
    this.checklistInputControl.setValue('', { emitEvent: false });
    this.drawerOpen.set(true);
    this.quickTaskControl.setValue('', { emitEvent: false });
  }

  addChecklistItem(): void {
    if (!this.taskDraft) {
      return;
    }
    const label = this.checklistInputControl.value.trim();
    if (!label) {
      return;
    }

    this.taskDraft = {
      ...this.taskDraft,
      checklist: [
        ...this.taskDraft.checklist,
        { id: `c${Date.now()}`, label, done: false },
      ],
    };
    this.checklistInputControl.setValue('', { emitEvent: false });
  }

  removeChecklistItem(itemId: string): void {
    if (!this.taskDraft) {
      return;
    }

    this.taskDraft = {
      ...this.taskDraft,
      checklist: this.taskDraft.checklist.filter((item) => item.id !== itemId),
    };
  }

  async saveDraft(): Promise<void> {
    if (!this.taskDraft) {
      return;
    }

    const draft = {
      ...this.taskDraft,
      title: this.taskDraft.title.trim() || 'Untitled task',
    };

    if (this.taskSource) {
      await this.saveExistingTask(this.taskSource, draft, this.taskRelatedType || null, this.taskRelatedId || null);
      this.closeDrawer();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const row = await firstValueFrom(
        this.planner.createTask({
          week_start: this.weekStart(),
          related_type: this.taskRelatedType || null,
          related_id: this.taskRelatedId || null,
          item_json: draft,
        })
      );
      this.tasks.update((items) => [row, ...items]);
      this.recomputeSummary();
      this.openTask(row);
    } catch {
      this.error.set('Could not create task.');
    } finally {
      this.saving.set(false);
    }
  }

  async markDone(task: PlannerTaskRow): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.planner.completeTask(task.id, {
          actual_min: task.item_json.actual_min ?? task.item_json.estimate_min,
        })
      );
      this.replaceTask(response.task);
      await this.loadInbox();
      this.recomputeSummary();
    } catch {
      this.error.set('Could not complete task.');
    } finally {
      this.saving.set(false);
    }
  }

  async captureQuickNote(): Promise<void> {
    const text = this.quickCaptureControl.value.trim();
    if (!text) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const meta: CaptureNoteMeta = {
        schema_version: 1,
        kind: 'capture',
        week_start: this.weekStart(),
        source: 'weekly',
        related_type: 'sp_planner',
        related_id: this.weekStart(),
      };

      await firstValueFrom(
        this.captureNotes.create({
          text,
          title: summarizeTitle(text),
          meta,
        })
      );

      this.quickCaptureControl.setValue('', { emitEvent: false });
      await this.loadInbox();
      this.summary.update((current) => ({
        ...current,
        capture_notes: current.capture_notes + 1,
      }));
    } catch {
      this.error.set('Could not capture note.');
    } finally {
      this.saving.set(false);
    }
  }

  async promoteNote(note: CaptureNote): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.captureNotes.promote(note.id, {
        note_type: 'reflection',
      }));
      await this.loadInbox();
      this.summary.update((current) => ({
        ...current,
        promoted_notes: current.promoted_notes + 1,
      }));
    } catch {
      this.error.set('Could not promote note.');
    } finally {
      this.saving.set(false);
    }
  }

  async archiveNote(note: CaptureNote): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.captureNotes.archive(note.id));
      await this.loadInbox();
    } catch {
      this.error.set('Could not archive note.');
    } finally {
      this.saving.set(false);
    }
  }

  async setFocusFromTask(task: PlannerTaskRow): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const focus = await firstValueFrom(this.userState.updateState({
        current_type: task.related_type ?? 'sp_planner',
        current_id: task.related_id ?? task.id,
        focus_mode: task.item_json.lane === 'podcast' ? 'producing' : 'studying',
      }));
      this.focusState.set(focus);
    } catch {
      this.error.set('Could not update focus.');
    } finally {
      this.saving.set(false);
    }
  }

  goToReview(): void {
    void this.router.navigate(['/review', this.weekStart()]);
  }

  openRelated(task: PlannerTaskRow): void {
    if (!task.related_id) {
      return;
    }

    if (task.related_type === 'wv_content_item') {
      void this.router.navigate(['/podcast', task.related_id]);
      return;
    }

    if (task.related_type === 'ar_lesson') {
      void this.router.navigate(['/lesson', task.related_id]);
      return;
    }
  }

  private async loadWeek(weekStart: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      let week = await firstValueFrom(this.planner.loadWeek(weekStart));
      if (!week.weekPlan) {
        week = await firstValueFrom(this.planner.ensureWeek(weekStart));
      }

      this.weekStart.set(week.week_start);
      this.weekPlan.set(week.weekPlan?.item_json ?? null);
      this.tasks.set(week.tasks);
      this.summary.set(week.summary);

      await Promise.all([
        this.loadInbox(),
        this.loadFocusState(),
      ]);
    } catch {
      this.error.set('Could not load week board.');
    } finally {
      this.loading.set(false);
    }
  }

  private async saveExistingTask(
    row: PlannerTaskRow,
    itemJson: PlannerTask,
    relatedType: string | null,
    relatedId: string | null
  ): Promise<void> {
    this.saving.set(true);
    this.error.set(null);

    try {
      const updated = await firstValueFrom(
        this.planner.updateTask(row.id, {
          related_type: relatedType,
          related_id: relatedId,
          item_json: itemJson,
        })
      );
      this.replaceTask(updated);
      this.recomputeSummary();

      if (this.selectedTaskId() === row.id) {
        this.openTask(updated);
      }
    } catch {
      this.error.set('Could not save task.');
    } finally {
      this.saving.set(false);
    }
  }

  private replaceTask(updated: PlannerTaskRow): void {
    this.tasks.update((items) => {
      const index = items.findIndex((item) => item.id === updated.id);
      if (index < 0) {
        return [updated, ...items];
      }
      const next = [...items];
      next[index] = updated;
      return next;
    });
  }

  private recomputeSummary(): void {
    const tasks = this.tasks();
    let done = 0;
    let minutes = 0;
    for (const task of tasks) {
      if (task.item_json.status === 'done') {
        done += 1;
      }
      if (typeof task.item_json.actual_min === 'number' && Number.isFinite(task.item_json.actual_min)) {
        minutes += task.item_json.actual_min;
      }
    }

    this.summary.update((current) => ({
      ...current,
      tasks_done: done,
      tasks_total: tasks.length,
      minutes_spent: minutes,
    }));
  }

  private async loadInbox(): Promise<void> {
    try {
      const notes = await firstValueFrom(this.captureNotes.list('inbox', 10));
      this.inboxNotes.set(notes);
      this.summary.update((current) => ({
        ...current,
        inbox_count: notes.length,
      }));
    } catch {
      this.inboxNotes.set([]);
    }
  }

  private async loadFocusState(): Promise<void> {
    try {
      const state = await firstValueFrom(this.userState.getState());
      this.focusState.set(state);
    } catch {
      this.focusState.set(null);
    }
  }

  private async loadFromParams(params: ParamMap): Promise<void> {
    const taskId = params.get('taskId');
    if (taskId) {
      try {
        const task = await firstValueFrom(this.planner.getTask(taskId));
        const week = computeWeekStartSydney(task.week_start ?? computeWeekStartSydney());
        this.weekStart.set(week);
        await this.loadWeek(week);
        const target = this.tasks().find((item) => item.id === taskId);
        if (target) {
          this.openTask(target);
        }
        return;
      } catch {
        this.error.set('Could not open linked task.');
      }
    }

    const weekStart = params.get('weekStart') || computeWeekStartSydney();
    const normalized = computeWeekStartSydney(weekStart);
    this.weekStart.set(normalized);
    await this.loadWeek(normalized);
  }
}

function createTaskTemplate(title: string): PlannerTask {
  return {
    schema_version: 1,
    lane: 'lesson',
    title,
    priority: 'P2',
    status: 'todo',
    estimate_min: 30,
    actual_min: null,
    tags: [],
    checklist: [],
    note: '',
    links: [],
    capture_on_done: {
      create_capture_note: true,
      template: 'What did I learn? What confused me? One next step.',
    },
    order_index: Date.now(),
  };
}

function summarizeTitle(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Capture note';
  }
  if (compact.length <= 60) {
    return compact;
  }
  return `${compact.slice(0, 57).trimEnd()}...`;
}
