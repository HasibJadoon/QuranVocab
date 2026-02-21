import { Component, computed, inject, signal } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PlannerLane, PlannerTask, PlannerTaskRow } from '../../sprint/models/sprint.models';
import { PlannerService } from '../../sprint/services/planner.service';

type BoardStatus = 'planned' | 'doing' | 'done';

@Component({
  selector: 'app-planner-kanban-page',
  standalone: false,
  templateUrl: './planner-kanban.page.html',
  styleUrl: './planner-kanban.page.scss',
})
export class PlannerKanbanPage {
  private readonly planner = inject(PlannerService);
  private readonly toastController = inject(ToastController);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly weekStart = signal(this.planner.currentWeekStart());
  readonly tasks = signal<PlannerTaskRow[]>([]);
  readonly activeStatus = signal<BoardStatus>('planned');

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];

  readonly grouped = computed(() => {
    const status = this.activeStatus();
    const items = this.tasks().filter((task) => this.toBoardStatus(task.item_json.status) === status);
    return this.lanes.map((lane) => ({
      lane,
      tasks: items.filter((task) => task.item_json.lane === lane),
    }));
  });

  constructor() {
    void this.load();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    event.target.complete();
  }

  onStatusChanged(value: string | number | null | undefined): void {
    if (value === 'planned' || value === 'doing' || value === 'done') {
      this.activeStatus.set(value);
    }
  }

  async setStatus(task: PlannerTaskRow, nextStatus: PlannerTask['status']): Promise<void> {
    this.saving.set(true);
    try {
      if (nextStatus === 'done') {
        const response = await firstValueFrom(this.planner.completeTask(task.id, {
          actual_min: task.item_json.actual_min ?? task.item_json.estimate_min,
        }));
        this.replaceTask(response.task);
      } else {
        const nextTask: PlannerTask = {
          ...task.item_json,
          status: nextStatus,
        };
        const updated = await firstValueFrom(this.planner.updateTask(task.id, {
          item_json: nextTask,
          related_type: task.related_type,
          related_id: task.related_id,
        }));
        this.replaceTask(updated);
      }
    } catch {
      await this.presentToast('Could not update task.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const week = await firstValueFrom(this.planner.ensureWeekAnchors(this.weekStart()));
      this.tasks.set(week.tasks);
    } catch {
      await this.presentToast('Could not load Kanban.');
    } finally {
      this.loading.set(false);
    }
  }

  private replaceTask(updated: PlannerTaskRow): void {
    this.tasks.update((items) => {
      const idx = items.findIndex((row) => row.id === updated.id);
      if (idx < 0) {
        return [updated, ...items];
      }
      const copy = [...items];
      copy[idx] = updated;
      return copy;
    });
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
