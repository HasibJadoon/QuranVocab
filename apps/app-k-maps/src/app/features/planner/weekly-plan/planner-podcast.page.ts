import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PodcastEpisode } from '../../sprint/models/sprint.models';
import { PodcastService } from '../../sprint/services/podcast.service';

@Component({
  selector: 'app-planner-podcast-page',
  standalone: false,
  templateUrl: './planner-podcast.page.html',
  styleUrl: './planner-podcast.page.scss',
})
export class PlannerPodcastPage {
  private readonly podcastService = inject(PodcastService);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly items = signal<PodcastEpisode[]>([]);

  constructor() {
    void this.load();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    event.target.complete();
  }

  openEpisode(item: PodcastEpisode): void {
    void this.router.navigate(['/podcast', item.id]);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const rows = await firstValueFrom(this.podcastService.list('', 80));
      this.items.set(rows);
    } catch {
      const toast = await this.toastController.create({
        message: 'Could not load podcast episodes.',
        duration: 1400,
        position: 'bottom',
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }
}
