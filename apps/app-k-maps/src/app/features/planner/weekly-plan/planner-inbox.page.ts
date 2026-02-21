import { Component, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IonItemSliding, ModalController, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CaptureNote, CaptureNoteMeta, PromotionRequest } from '../../sprint/models/sprint.models';
import { CaptureNotesService } from '../../sprint/services/capture-notes.service';
import { PlannerService } from '../../sprint/services/planner.service';
import { PromoteNoteModalComponent } from './modals/promote-note.modal';

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
  private readonly modalController = inject(ModalController);

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
        related_type: 'sp_weekly_plans',
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

  async openPromoteModal(note: CaptureNote, sliding?: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();
    const modal = await this.modalController.create({
      component: PromoteNoteModalComponent,
      componentProps: {
        note,
      },
      breakpoints: [0, 0.62, 0.9],
      initialBreakpoint: 0.9,
    });

    await modal.present();
    const result = await modal.onDidDismiss<PromotionRequest>();
    if (result.role !== 'promote' || !result.data) {
      return;
    }

    this.saving.set(true);
    try {
      await firstValueFrom(this.notes.promote(note.id, result.data));
      await this.load();
      await this.presentToast('Note promoted.');
    } catch {
      await this.presentToast('Could not promote note.');
    } finally {
      this.saving.set(false);
    }
  }

  async archive(note: CaptureNote, sliding?: IonItemSliding | HTMLIonItemSlidingElement | null): Promise<void> {
    await sliding?.close();
    this.saving.set(true);
    try {
      await firstValueFrom(this.notes.archive(note.id));
      await this.load();
      await this.presentToast('Archived.');
    } catch {
      await this.presentToast('Could not archive note.');
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
