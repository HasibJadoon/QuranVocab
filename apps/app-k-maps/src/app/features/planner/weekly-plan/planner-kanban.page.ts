import { Component, computed, inject, signal } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PlannerLane, PlannerTaskRow } from '../../sprint/models/sprint.models';
import { PlannerService } from '../../sprint/services/planner.service';

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

  readonly lanes: PlannerLane[] = ['lesson', 'podcast', 'notes', 'admin'];

  readonly grouped = computed(() => {
    const items = this.tasks();
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

  async complete(task: PlannerTaskRow): Promise<void> {
    this.saving.set(true);
    try {
      const response = await firstValueFrom(this.planner.completeTask(task.id, {
        actual_min: task.item_json.actual_min ?? task.item_json.estimate_min,
      }));
      this.tasks.update((items) => {
        const idx = items.findIndex((row) => row.id === response.task.id);
        if (idx < 0) return items;
        const copy = [...items];
        copy[idx] = response.task;
        return copy;
      });
    } catch {
      await this.presentToast('Could not complete task.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      let week = await firstValueFrom(this.planner.loadWeek(this.weekStart()));
      if (!week.weekPlan) {
        week = await firstValueFrom(this.planner.ensureWeek(this.weekStart()));
      }
      this.tasks.set(week.tasks);
    } catch {
      await this.presentToast('Could not load Kanban.');
    } finally {
      this.loading.set(false);
    }
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
