import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged, finalize, map, take } from 'rxjs';
import { NotesApiService } from './notes-api.service';

@Component({
  selector: 'app-notes-inbox-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
})
export class InboxPage {
  private readonly notesApi = inject(NotesApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastController = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl(this.route.snapshot.queryParamMap.get('q') ?? '', { nonNullable: true });
  readonly creating = signal(false);

  constructor() {
    this.searchControl.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((query) => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: query || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  createNote(): void {
    if (this.creating()) {
      return;
    }

    this.creating.set(true);
    this.notesApi.createNote({ body_md: '' }).pipe(
      take(1),
      finalize(() => this.creating.set(false))
    ).subscribe({
      next: (note) => {
        void this.router.navigate(['/notes', note.id]);
      },
      error: () => {
        void this.presentToast('Could not create a note.');
      },
    });
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
    });
    await toast.present();
  }
}
