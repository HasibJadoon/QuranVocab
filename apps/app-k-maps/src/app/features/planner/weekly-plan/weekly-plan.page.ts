import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonicModule,
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

@Component({
  selector: 'app-weekly-plan',
  standalone: false,
  templateUrl: './weekly-plan.page.html',
})
export class WeeklyPlanPage {
  private readonly planner = inject(PlannerService);
  private readonly captureNotes = inject(CaptureNotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selectedLane = signal<PlannerLane>('lesson');
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

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];

  readonly laneTasks = computed(() => {
    const lane = this.selectedLane();
    return this.tasks()
      .filter((task) => task.item_json.lane === lane)
      .sort((a, b) => {
        const updatedA = new Date(a.updated_at ?? a.created_at).getTime();
        const updatedB = new Date(b.updated_at ?? b.created_at).getTime();
        return updatedB - updatedA;
      });
  });

  readonly progressPct = computed(() => {
    const state = this.summary();
    if (!state.tasks_total) {
      return 0;
    }
    return Math.round((state.tasks_done / state.tasks_total) * 100);
  });

  constructor() {
    this.route.paramMap.subscribe(() => {
      const fromCurrent = this.route.snapshot.paramMap.get('weekStart');
      const fromParent = this.route.parent?.snapshot.paramMap.get('weekStart');
      const weekStart = computeWeekStartSydney(fromCurrent ?? fromParent ?? computeWeekStartSydney());
      this.weekStart.set(weekStart);
      void this.loadWeek(weekStart);
    });
  }

  onLaneChanged(event: CustomEvent): void {
    const value = String(event.detail?.value ?? 'lesson') as PlannerLane;
    if (this.lanes.includes(value)) {
      this.selectedLane.set(value);
    }
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.loadWeek(this.weekStart());
    event.target.complete();
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
        related_type: 'sp_planner',
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
      },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.9,
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

  async openEditModal(task: PlannerTaskRow, sliding?: { close: () => Promise<void> } | null): Promise<void> {
    await sliding?.close();

    const modal = await this.modalController.create({
      component: TaskEditModalComponent,
      componentProps: {
        initialTask: task.item_json,
        relatedType: task.related_type,
        relatedId: task.related_id,
      },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.9,
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
      },
      breakpoints: [0, 0.65, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();
    const result = await modal.onDidDismiss<{ item_json?: PlannerTask; actual_min?: number }>();
    if (result.role === 'save' && result.data?.item_json) {
      await this.updateTask(task, result.data.item_json, task.related_type, task.related_id);
      return;
    }

    if (result.role === 'complete') {
      await this.completeTask(task, result.data?.actual_min);
    }
  }

  async completeFromSwipe(task: PlannerTaskRow, event: Event): Promise<void> {
    const sliding = event.target as HTMLIonItemSlidingElement | null;
    await sliding?.close();
    await this.completeTask(task, task.item_json.actual_min ?? task.item_json.estimate_min);
  }

  async moveLane(task: PlannerTaskRow, event: Event): Promise<void> {
    const sliding = event.target as HTMLIonItemSlidingElement | null;
    await sliding?.close();

    const index = this.lanes.indexOf(task.item_json.lane);
    const nextLane = this.lanes[(index + 1) % this.lanes.length];
    const nextTask: PlannerTask = {
      ...task.item_json,
      lane: nextLane,
    };
    await this.updateTask(task, nextTask, task.related_type, task.related_id);
  }

  private async loadWeek(weekStart: string): Promise<void> {
    this.loading.set(true);
    try {
      let week = await firstValueFrom(this.planner.loadWeek(weekStart));
      if (!week.weekPlan) {
        week = await firstValueFrom(this.planner.ensureWeek(weekStart));
      }

      this.weekPlan.set(week.weekPlan?.item_json ?? null);
      this.tasks.set(week.tasks);
      this.summary.set(week.summary);
    } catch {
      await this.presentToast('Could not load weekly sprint.');
    } finally {
      this.loading.set(false);
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

    this.summary.update((state) => ({
      ...state,
      tasks_done: done,
      tasks_total: tasks.length,
      minutes_spent: minutes,
    }));
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
