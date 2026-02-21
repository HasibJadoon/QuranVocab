import { Component, computed, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonItemSliding,
  ModalController,
  RefresherCustomEvent,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CaptureNotesService } from '../../sprint/services/capture-notes.service';
import { PlannerService } from '../../sprint/services/planner.service';
import {
  CaptureNoteMeta,
  PlannerLane,
  PlannerTask,
  PlannerTaskRow,
  PlannerWeekPlan,
  PlannerWeekSummary,
} from '../../sprint/models/sprint.models';
import { computeWeekStartSydney, formatWeekRangeLabel } from '../../sprint/utils/week-start.util';
import { TaskDetailModalComponent } from './modals/task-detail.modal';
import { TaskEditModalComponent } from './modals/task-edit.modal';
import { PlanWeekModalComponent, PlanWeekModalResult } from './modals/plan-week.modal';

type BoardStatus = 'planned' | 'doing' | 'done';

@Component({
  selector: 'app-weekly-plan',
  standalone: false,
  templateUrl: './weekly-plan.page.html',
  styleUrl: './weekly-plan.page.scss',
})
export class WeeklyPlanPage {
  private readonly planner = inject(PlannerService);
  private readonly captureNotes = inject(CaptureNotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly weekStart = signal(computeWeekStartSydney());
  readonly weekLabel = computed(() => formatWeekRangeLabel(this.weekStart()));

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

  readonly captureControl = new FormControl('', { nonNullable: true });
  activeStatus: BoardStatus = 'planned';
  readonly expandedLanes = signal<Array<PlannerLane>>(['lesson', 'podcast', 'notes', 'admin']);

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];

  readonly shouldPromptPlanning = computed(() => {
    const plan = this.weekPlan();
    if (!plan) {
      return false;
    }
    const planning = plan.planning_state;
    if (planning.is_planned) {
      return false;
    }

    if (!planning.defer_until) {
      return true;
    }

    const deferAt = new Date(planning.defer_until).getTime();
    if (Number.isNaN(deferAt)) {
      return true;
    }

    return Date.now() >= deferAt;
  });

  readonly lessonDone = computed(() => this.countAnchorDone('lesson'));
  readonly podcastDone = computed(() => this.countAnchorDone('podcast'));
  readonly minuteTarget = computed(() => {
    const budget = this.weekPlan()?.time_budget;
    if (!budget) {
      return 450;
    }
    return budget.lesson_min + budget.podcast_min + budget.review_min;
  });

  readonly progressPct = computed(() => {
    const total = this.summary().tasks_total;
    if (!total) {
      return 0;
    }
    return Math.min(100, Math.round((this.summary().tasks_done / total) * 100));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const weekStart = computeWeekStartSydney(params.get('weekStart') ?? this.planner.currentWeekStart());
      this.weekStart.set(weekStart);
      void this.loadWeek(weekStart);
    });
  }

  tasksForLane(lane: PlannerLane): PlannerTaskRow[] {
    return this.tasks()
      .filter((task) => task.item_json.lane === lane && this.toBoardStatus(task.item_json.status) === this.activeStatus)
      .sort((a, b) => {
        const orderA = typeof a.item_json.order_index === 'number' ? a.item_json.order_index : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.item_json.order_index === 'number' ? b.item_json.order_index : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const updatedA = new Date(a.updated_at ?? a.created_at).getTime();
        const updatedB = new Date(b.updated_at ?? b.created_at).getTime();
        return updatedB - updatedA;
      });
  }

  laneCount(lane: PlannerLane): number {
    return this.tasksForLane(lane).length;
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.loadWeek(this.weekStart());
    event.target.complete();
  }

  onStatusChanged(value: string | number | null | undefined): void {
    if (value === 'planned' || value === 'doing' || value === 'done') {
      this.activeStatus = value;
    }
  }

  async captureQuickNote(): Promise<void> {
    const text = this.captureControl.value.trim();
    if (!text) {
      return;
    }

    this.saving.set(true);
    try {
      const meta: CaptureNoteMeta = {
        schema_version: 1,
        kind: 'capture',
        week_start: this.weekStart(),
        source: 'weekly',
        related_type: 'sp_weekly_plans',
        related_id: this.weekStart(),
      };

      await firstValueFrom(this.captureNotes.create({
        text,
        title: summarizeTitle(text),
        meta,
      }));

      this.captureControl.setValue('', { emitEvent: false });
      await this.presentToast('Captured.');
    } catch {
      await this.presentToast('Could not capture note.');
    } finally {
      this.saving.set(false);
    }
  }

  async openCreateModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskEditModalComponent,
      componentProps: {
        initialTask: null,
        weekStart: this.weekStart(),
      },
      breakpoints: [0, 0.6, 0.92],
      initialBreakpoint: 0.92,
    });

    await modal.present();
    const result = await modal.onDidDismiss<{ item_json: PlannerTask; related_type: string | null; related_id: string | null }>();
    if (result.role !== 'save' || !result.data) {
      return;
    }

    this.saving.set(true);
    try {
      const created = await firstValueFrom(this.planner.createTask({
        week_start: this.weekStart(),
        item_json: result.data.item_json,
        related_type: result.data.related_type,
        related_id: result.data.related_id,
      }));

      this.tasks.update((items) => [created, ...items]);
      this.recomputeSummary();
      await this.presentToast('Task created.');
    } catch {
      await this.presentToast('Could not create task.');
    } finally {
      this.saving.set(false);
    }
  }

  async openEditModal(task: PlannerTaskRow, sliding?: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();

    const modal = await this.modalController.create({
      component: TaskEditModalComponent,
      componentProps: {
        initialTask: task.item_json,
        relatedType: task.related_type,
        relatedId: task.related_id,
        weekStart: this.weekStart(),
      },
      breakpoints: [0, 0.6, 0.92],
      initialBreakpoint: 0.92,
    });

    await modal.present();
    const result = await modal.onDidDismiss<{ item_json: PlannerTask; related_type: string | null; related_id: string | null }>();
    if (result.role !== 'save' || !result.data) {
      return;
    }

    await this.updateTask(task, result.data.item_json, result.data.related_type, result.data.related_id);
  }

  async openDetailModal(task: PlannerTaskRow): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskDetailModalComponent,
      componentProps: {
        task,
        weekStart: this.weekStart(),
      },
      breakpoints: [0, 0.72, 0.96],
      initialBreakpoint: 0.96,
    });

    await modal.present();
    const result = await modal.onDidDismiss<{ item_json?: PlannerTask; actual_min?: number; capture_text?: string }>();
    if (result.role === 'save' && result.data?.item_json) {
      await this.updateTask(task, result.data.item_json, task.related_type, task.related_id);
      return;
    }

    if (result.role === 'complete') {
      await this.completeTask(task, result.data?.actual_min);
      return;
    }

    if (result.role === 'capture' && result.data?.capture_text) {
      await this.createTaskCapture(task, result.data.capture_text);
    }
  }

  async moveToDoing(task: PlannerTaskRow, sliding: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();
    const nextTask: PlannerTask = {
      ...task.item_json,
      status: 'doing',
    };
    await this.updateTask(task, nextTask, task.related_type, task.related_id);
  }

  async markBlocked(task: PlannerTaskRow, sliding: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();
    const nextTask: PlannerTask = {
      ...task.item_json,
      status: 'blocked',
    };
    await this.updateTask(task, nextTask, task.related_type, task.related_id);
  }

  async completeFromSwipe(task: PlannerTaskRow, sliding: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();
    await this.completeTask(task, task.item_json.actual_min ?? task.item_json.estimate_min);
  }

  openKanbanView(): void {
    void this.router.navigate(['/planner/kanban']);
  }

  private async loadWeek(weekStart: string): Promise<void> {
    this.loading.set(true);
    try {
      const week = await firstValueFrom(this.planner.ensureWeekAnchors(weekStart));
      this.weekPlan.set(week.weekPlan?.item_json ?? null);
      this.tasks.set(week.tasks);
      this.summary.set(week.summary);
      this.recomputeSummary();

      if (this.shouldPromptPlanning()) {
        await this.openPlanWeekModal(true);
      }
    } catch {
      await this.presentToast('Could not load weekly sprint.');
    } finally {
      this.loading.set(false);
    }
  }

  async openPlanWeekModal(blocking = false): Promise<void> {
    const modal = await this.modalController.create({
      component: PlanWeekModalComponent,
      componentProps: {
        weekStart: this.weekStart(),
        weekPlan: this.weekPlan(),
        tasks: this.tasks(),
      },
      backdropDismiss: !blocking,
      breakpoints: [0, 0.72, 0.98],
      initialBreakpoint: 0.98,
    });

    await modal.present();
    const result = await modal.onDidDismiss<PlanWeekModalResult>();
    if (!result.data) {
      return;
    }

    if (result.data.mode === 'later') {
      await this.deferPlanning();
      return;
    }

    if (result.data.mode === 'save') {
      await this.savePlanning(result.data.assignments);
    }
  }

  private async savePlanning(assignments: Record<string, unknown>): Promise<void> {
    this.saving.set(true);
    try {
      const response = await firstValueFrom(this.planner.planWeek({
        week_start: this.weekStart(),
        planning_state: { is_planned: true },
        assignments,
      }));
      this.weekPlan.set(response.weekPlan?.item_json ?? null);
      this.tasks.set(response.tasks);
      this.summary.set(response.summary);
      this.recomputeSummary();
    } catch {
      await this.presentToast('Could not save plan.');
    } finally {
      this.saving.set(false);
    }
  }

  private async deferPlanning(): Promise<void> {
    this.saving.set(true);
    try {
      const response = await firstValueFrom(this.planner.planWeek({
        week_start: this.weekStart(),
        later_today: true,
        planning_state: { is_planned: false },
      }));
      this.weekPlan.set(response.weekPlan?.item_json ?? null);
      this.tasks.set(response.tasks);
      this.summary.set(response.summary);
      this.recomputeSummary();
    } catch {
      await this.presentToast('Could not defer planning.');
    } finally {
      this.saving.set(false);
    }
  }

  private async updateTask(
    task: PlannerTaskRow,
    itemJson: PlannerTask,
    relatedType: string | null,
    relatedId: string | null
  ): Promise<void> {
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(this.planner.updateTask(task.id, {
        item_json: itemJson,
        related_type: relatedType,
        related_id: relatedId,
      }));

      this.replaceTask(updated);
      this.recomputeSummary();
      await this.presentToast('Task saved.');
    } catch {
      await this.presentToast('Could not save task.');
    } finally {
      this.saving.set(false);
    }
  }

  private async completeTask(task: PlannerTaskRow, actualMin?: number | null): Promise<void> {
    this.saving.set(true);
    try {
      const response = await firstValueFrom(this.planner.completeTask(task.id, {
        actual_min: actualMin ?? undefined,
      }));
      this.replaceTask(response.task);
      this.recomputeSummary();
      await this.presentToast('Task completed.');
    } catch {
      await this.presentToast('Could not complete task.');
    } finally {
      this.saving.set(false);
    }
  }

  private async createTaskCapture(task: PlannerTaskRow, text: string): Promise<void> {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    this.saving.set(true);
    try {
      const meta: CaptureNoteMeta = {
        schema_version: 1,
        kind: 'capture',
        week_start: this.weekStart(),
        source: task.item_json.lane === 'podcast' ? 'podcast' : 'lesson',
        related_type: task.related_type ?? 'sp_weekly_tasks',
        related_id: task.related_id ?? task.id,
        task_type: 'task',
      };

      await firstValueFrom(this.captureNotes.create({
        text: normalized,
        title: summarizeTitle(normalized),
        meta,
      }));
      await this.presentToast('Note captured.');
    } catch {
      await this.presentToast('Could not capture note.');
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
      if (this.toBoardStatus(task.item_json.status) === 'done') {
        done += 1;
      }
      if (typeof task.item_json.actual_min === 'number' && Number.isFinite(task.item_json.actual_min)) {
        minutes += task.item_json.actual_min;
      }
    }

    this.summary.update((state) => ({
      ...state,
      tasks_done: done,
      tasks_total: tasks.length,
      minutes_spent: minutes,
    }));
  }

  private countAnchorDone(lane: 'lesson' | 'podcast'): number {
    return this.tasks().filter((task) => task.item_json.anchor && task.item_json.lane === lane && this.toBoardStatus(task.item_json.status) === 'done').length;
  }

  assignmentSummary(task: PlannerTaskRow): string {
    if (task.item_json.lane === 'lesson') {
      if (task.item_json.assignment.ar_lesson_id) {
        return `Lesson #${task.item_json.assignment.ar_lesson_id} · ${task.item_json.estimate_min} min`;
      }
      return `${task.item_json.estimate_min} min · Not assigned`;
    }

    if (task.item_json.lane === 'podcast') {
      if (task.item_json.assignment.topic) {
        return `${task.item_json.estimate_min} min · ${task.item_json.assignment.topic}`;
      }
      return `${task.item_json.estimate_min} min · Topic pending`;
    }

    return `${task.item_json.estimate_min} min`;
  }

  private toBoardStatus(status: string): BoardStatus {
    if (status === 'done') {
      return 'done';
    }
    if (status === 'doing' || status === 'blocked') {
      return 'doing';
    }
    return 'planned';
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }
}

function summarizeTitle(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Capture note';
  }

  if (compact.length <= 60) {
    return compact;
  }

  return `${compact.slice(0, 57).replace(/\s+$/, '')}...`;
}
