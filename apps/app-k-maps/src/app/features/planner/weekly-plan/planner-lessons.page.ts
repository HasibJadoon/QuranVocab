import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { LessonPickerItem } from '../../sprint/models/sprint.models';
import { LessonsService } from '../../sprint/services/lessons.service';

@Component({
  selector: 'app-planner-lessons-page',
  standalone: false,
  templateUrl: './planner-lessons.page.html',
  styleUrl: './planner-lessons.page.scss',
})
export class PlannerLessonsPage {
  private readonly lessonsService = inject(LessonsService);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly lessons = signal<LessonPickerItem[]>([]);

  constructor() {
    void this.load();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    event.target.complete();
  }

  openLesson(lesson: LessonPickerItem): void {
    void this.router.navigate(['/arabic/lessons', lesson.id, 'study']);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const lessons = await firstValueFrom(this.lessonsService.list('', 80));
      this.lessons.set(lessons);
    } catch {
      const toast = await this.toastController.create({
        message: 'Could not load lessons.',
        duration: 1400,
        position: 'bottom',
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }
}
