import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, finalize, map, of, startWith, switchMap, take, tap } from 'rxjs';
import { NotesApiService } from './notes-api.service';
import { Note, computePreview, computeTitleFromMarkdown } from './notes.models';

@Component({
  selector: 'app-notes-inbox-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterLink],
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
})
export class InboxPage {
  private readonly notesApi = inject(NotesApiService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  private readonly notesSubject = new BehaviorSubject<Note[]>([]);
  readonly notes$ = this.notesSubject.asObservable();

  constructor() {
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((query) => this.fetchNotes(query)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
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

  onRefresh(event: RefresherCustomEvent): void {
    this.fetchNotes(this.searchControl.value.trim(), () => event.target.complete()).pipe(take(1)).subscribe();
  }

  titleFor(note: Note): string {
    return note.title?.trim() || computeTitleFromMarkdown(note.body_md) || 'Untitled';
  }

  previewFor(note: Note): string {
    return computePreview(note.body_md, 100) || 'Tap to start writing...';
  }

  trackNote(_: number, note: Note): string {
    return note.id;
  }

  private fetchNotes(query: string, done?: () => void): Observable<Note[]> {
    this.loading.set(true);

    return this.notesApi.listNotes('inbox', query).pipe(
      tap((notes) => {
        this.notesSubject.next(notes);
      }),
      catchError(() => {
        this.notesSubject.next([]);
        void this.presentToast('Could not load notes.');
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        done?.();
      })
    );
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
