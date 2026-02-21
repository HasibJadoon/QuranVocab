import { Component, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CaptureNote, CaptureNoteMeta } from '../../sprint/models/sprint.models';
import { CaptureNotesService } from '../../sprint/services/capture-notes.service';
import { PlannerService } from '../../sprint/services/planner.service';

@Component({
  selector: 'app-planner-inbox-page',
  standalone: false,
  templateUrl: './planner-inbox.page.html',
  styleUrl: './planner-inbox.page.scss',
})
export class PlannerInboxPage {
  private readonly notes = inject(CaptureNotesService);
  private readonly planner = inject(PlannerService);
  private readonly toastController = inject(ToastController);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly weekStart = signal(this.planner.currentWeekStart());
  readonly captureControl = new FormControl('', { nonNullable: true });
  readonly items = signal<CaptureNote[]>([]);

  constructor() {
    void this.load();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    event.target.complete();
  }

  async capture(): Promise<void> {
    const text = this.captureControl.value.trim();
    if (!text) return;

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

      await firstValueFrom(this.notes.create({
        text,
        title: text.length > 60 ? `${text.slice(0, 57).replace(/\s+$/, '')}...` : text,
        meta,
      }));
      this.captureControl.setValue('', { emitEvent: false });
      await this.load();
    } catch {
      await this.presentToast('Could not capture note.');
    } finally {
      this.saving.set(false);
    }
  }

  async promote(note: CaptureNote): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.notes.promote(note.id, { note_type: 'reflection' }));
      await this.load();
    } catch {
      await this.presentToast('Could not promote note.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const notes = await firstValueFrom(this.notes.list('inbox', 50));
      this.items.set(notes);
    } catch {
      await this.presentToast('Could not load inbox.');
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
