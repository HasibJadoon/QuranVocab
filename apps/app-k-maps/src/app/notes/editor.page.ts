import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  merge,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AttachModalComponent } from './attach-modal.component';
import { NotesApiService } from './notes-api.service';
import { Comment as NoteComment, Note, NoteDetail, NoteLink, computeTitleFromMarkdown } from './notes.models';

@Component({
  selector: 'app-note-editor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
})
export class EditorPage {
  private readonly notesApi = inject(NotesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly bodyControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly archivePending = signal(false);
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  readonly note = signal<NoteDetail | null>(null);
  readonly noteLinks = signal<NoteLink[]>([]);
  readonly comments = signal<NoteComment[]>([]);
  readonly commentsLoading = signal(false);
  readonly commentsSubmitting = signal(false);

  private readonly autosaveInput$ = new Subject<string>();
  private readonly forceSaveInput$ = new Subject<string>();
  private readonly lastSavedTrimmed = signal('');
  readonly commentControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((noteId): noteId is string => !!noteId),
      distinctUntilChanged(),
      switchMap((noteId) => this.loadNote(noteId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    this.bodyControl.valueChanges.pipe(
      map((raw) => raw ?? ''),
      tap((raw) => {
        if (!this.note()) {
          return;
        }

        this.saveState.set('saving');
        this.autosaveInput$.next(raw);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    const debouncedAutoSave$ = this.autosaveInput$.pipe(
      map((raw) => ({ raw, trimmed: raw.trim() })),
      distinctUntilChanged((prev, next) => prev.trimmed === next.trimmed),
      debounceTime(600)
    );

    const forceSave$ = this.forceSaveInput$.pipe(
      map((raw) => ({ raw, trimmed: raw.trim() }))
    );

    merge(debouncedAutoSave$, forceSave$).pipe(
      tap(({ trimmed }) => {
        if (trimmed === this.lastSavedTrimmed()) {
          this.saveState.set('saved');
        }
      }),
      filter(({ trimmed }) => trimmed !== this.lastSavedTrimmed()),
      switchMap(({ raw, trimmed }) => this.persistBody(raw, trimmed)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  get title(): string {
    return computeTitleFromMarkdown(this.bodyControl.value) || 'Untitled';
  }

  get saveLabel(): string {
    switch (this.saveState()) {
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved ✓';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  }

  get isArchived(): boolean {
    return this.note()?.status === 'archived';
  }

  forceSaveNow(): void {
    this.saveState.set('saving');
    this.forceSaveInput$.next(this.bodyControl.value ?? '');
  }

  async openAttachModal(): Promise<void> {
    const activeNote = this.note();
    if (!activeNote) {
      return;
    }

    const modal = await this.modalController.create({
      component: AttachModalComponent,
      componentProps: { noteId: activeNote.id },
      breakpoints: [0, 0.45, 0.72, 0.95],
      initialBreakpoint: 0.72,
      backdropDismiss: true,
    });

    await modal.present();

    const result = await modal.onDidDismiss<NoteLink>();
    if (result.role === 'attached' && result.data) {
      this.noteLinks.update((links) => {
        const exists = links.some((link) =>
          link.target_type === result.data?.target_type && link.target_id === result.data?.target_id
        );

        if (exists) {
          return links;
        }

        return [result.data as NoteLink, ...links];
      });
    }
  }

  removeLink(link: NoteLink): void {
    const activeNote = this.note();
    if (!activeNote) {
      return;
    }

    this.notesApi.removeLink(activeNote.id, link.target_type, link.target_id).pipe(take(1)).subscribe({
      next: () => {
        this.noteLinks.update((links) =>
          links.filter((item) => !(item.target_type === link.target_type && item.target_id === link.target_id))
        );
      },
      error: () => {
        void this.presentToast('Could not remove attachment.');
      },
    });
  }

  toggleArchive(): void {
    const activeNote = this.note();
    if (!activeNote || this.archivePending()) {
      return;
    }

    this.archivePending.set(true);

    const nextStatus = activeNote.status === 'archived' ? 'inbox' : 'archived';
    const request$ = nextStatus === 'archived'
      ? this.notesApi.archiveNote(activeNote.id)
      : this.notesApi.unarchiveNote(activeNote.id);

    request$.pipe(
      take(1),
      finalize(() => this.archivePending.set(false))
    ).subscribe({
      next: (response) => {
        const merged: NoteDetail = {
          ...activeNote,
          ...(response ?? {}),
          status: nextStatus,
          links: this.noteLinks(),
        };

        this.note.set(merged);
      },
      error: () => {
        void this.presentToast('Could not update archive state.');
      },
    });
  }

  iconFor(targetType: NoteLink['target_type']): string {
    switch (targetType) {
      case 'quran_word':
        return 'text-outline';
      case 'ar_u_lexicon':
        return 'bookmarks-outline';
      case 'wv_concept':
        return 'compass-outline';
      case 'quran_ayah':
      default:
        return 'book-outline';
    }
  }

  trackLink(_: number, link: NoteLink): string {
    return `${link.target_type}:${link.target_id}`;
  }

  trackComment(_: number, comment: NoteComment): string {
    return comment.id;
  }

  refreshComments(): void {
    const activeNote = this.note();
    if (!activeNote) {
      return;
    }

    this.loadComments(activeNote.id).pipe(take(1)).subscribe();
  }

  submitComment(): void {
    const activeNote = this.note();
    const body = this.commentControl.value.trim();
    if (!activeNote || !body || this.commentsSubmitting()) {
      return;
    }

    this.commentsSubmitting.set(true);

    this.notesApi.createComment({
      target_type: 'note',
      target_id: activeNote.id,
      body_md: body,
    }).pipe(
      take(1),
      finalize(() => this.commentsSubmitting.set(false))
    ).subscribe({
      next: (comment) => {
        this.comments.update((items) => [comment, ...items]);
        this.commentControl.setValue('', { emitEvent: false });
      },
      error: () => {
        void this.presentToast('Could not add comment.');
      },
    });
  }

  private loadNote(noteId: string) {
    this.loading.set(true);

    return this.notesApi.getNote(noteId).pipe(
      switchMap((note) => {
        this.note.set(note);
        this.noteLinks.set(note.links ?? []);

        const body = note.body_md ?? '';
        this.bodyControl.setValue(body, { emitEvent: false });

        this.lastSavedTrimmed.set(body.trim());
        this.saveState.set('saved');
        this.commentControl.setValue('', { emitEvent: false });
        return this.loadComments(note.id).pipe(map(() => note));
      }),
      catchError(() => {
        this.note.set(null);
        this.noteLinks.set([]);
        this.comments.set([]);
        this.commentControl.setValue('', { emitEvent: false });
        this.saveState.set('error');
        void this.presentToast('Could not load this note.');
        return of(null);
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  private loadComments(noteId: string) {
    this.commentsLoading.set(true);

    return this.notesApi.getComments('note', noteId).pipe(
      tap((comments) => {
        this.comments.set(comments);
      }),
      catchError(() => {
        this.comments.set([]);
        void this.presentToast('Could not load comments.');
        return of([]);
      }),
      finalize(() => {
        this.commentsLoading.set(false);
      })
    );
  }

  private persistBody(raw: string, trimmed: string) {
    const activeNote = this.note();
    if (!activeNote) {
      return of(null);
    }

    this.saveState.set('saving');

    const payload = {
      body_md: raw,
      title: computeTitleFromMarkdown(raw),
    };

    return this.notesApi.updateNote(activeNote.id, payload).pipe(
      tap((updated: Note) => {
        const merged: NoteDetail = {
          ...activeNote,
          ...updated,
          body_md: raw,
          title: payload.title,
          updated_at: updated.updated_at ?? new Date().toISOString(),
          links: this.noteLinks(),
        };

        this.note.set(merged);
        this.lastSavedTrimmed.set(trimmed);
        this.saveState.set('saved');
      }),
      catchError(() => {
        this.saveState.set('error');
        void this.presentToast('Could not save changes.');
        return of(null);
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
