import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { AttachDialogComponent } from './attach-dialog.component';
import { NotesApiService } from './notes-api.service';
import {
  NoteComment,
  Note,
  NoteDetail,
  NoteLink,
  NoteStatus,
  computeTitleFromMarkdown,
} from './notes.models';

export interface NoteDraftEvent {
  id: string;
  body_md: string;
  title: string | null;
  updated_at: string;
}

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AttachDialogComponent],
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss'],
})
export class NoteEditorComponent {
  private readonly notesApi = inject(NotesApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly noteIdInput$ = new Subject<string | null>();
  private readonly autosaveInput$ = new Subject<string>();
  private readonly forceSaveInput$ = new Subject<string>();
  private readonly lastSavedTrimmed = signal('');

  readonly bodyControl = new FormControl('', { nonNullable: true });
  readonly commentControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly archivePending = signal(false);
  readonly attachDialogOpen = signal(false);
  readonly commentsLoading = signal(false);
  readonly commentsSubmitting = signal(false);
  readonly commentsError = signal<string | null>(null);

  readonly activeNote = signal<NoteDetail | null>(null);
  readonly links = signal<NoteLink[]>([]);
  readonly comments = signal<NoteComment[]>([]);
  readonly currentNoteId = signal<string | null>(null);

  @Output() readonly draftChanged = new EventEmitter<NoteDraftEvent>();
  @Output() readonly notePatched = new EventEmitter<Note>();
  @Output() readonly noteStatusChanged = new EventEmitter<Note>();

  @Input() set noteId(value: string | null) {
    this.noteIdInput$.next(value);
  }

  constructor() {
    this.noteIdInput$.pipe(
      distinctUntilChanged(),
      switchMap((noteId) => {
        this.currentNoteId.set(noteId);

        if (!noteId) {
          this.resetEditor();
          return of(null);
        }

        return this.loadNote(noteId);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    this.bodyControl.valueChanges.pipe(
      map((raw) => raw ?? ''),
      tap((raw) => {
        const note = this.activeNote();
        if (!note) {
          return;
        }

        const nextTitle = computeTitleFromMarkdown(raw);
        this.activeNote.update((current) => current
          ? { ...current, body_md: raw, title: nextTitle }
          : current);

        this.draftChanged.emit({
          id: note.id,
          body_md: raw,
          title: nextTitle,
          updated_at: new Date().toISOString(),
        });

        this.saveState.set('saving');
        this.autosaveInput$.next(raw);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    const debouncedAutosave$ = this.autosaveInput$.pipe(
      map((raw) => ({ raw, trimmed: raw.trim() })),
      distinctUntilChanged((prev, next) => prev.trimmed === next.trimmed),
      debounceTime(600)
    );

    const forceSave$ = this.forceSaveInput$.pipe(
      map((raw) => ({ raw, trimmed: raw.trim() }))
    );

    merge(debouncedAutosave$, forceSave$).pipe(
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
        return 'Saving...';
      case 'saved':
        return 'Saved ✓';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  }

  get isArchived(): boolean {
    return this.activeNote()?.status === 'archived';
  }

  forceSave(): void {
    if (!this.activeNote()) {
      return;
    }

    this.saveState.set('saving');
    this.forceSaveInput$.next(this.bodyControl.value ?? '');
  }

  openAttachDialog(): void {
    if (!this.activeNote()) {
      return;
    }

    this.attachDialogOpen.set(true);
  }

  closeAttachDialog(): void {
    this.attachDialogOpen.set(false);
  }

  onLinkAttached(link: NoteLink): void {
    this.attachDialogOpen.set(false);

    this.links.update((current) => {
      const exists = current.some((item) =>
        item.target_type === link.target_type && item.target_id === link.target_id
      );

      if (exists) {
        return current;
      }

      return [link, ...current];
    });
  }

  removeLink(link: NoteLink): void {
    const note = this.activeNote();
    if (!note) {
      return;
    }

    this.notesApi.removeLink(note.id, link.target_type, link.target_id).pipe(take(1)).subscribe({
      next: () => {
        this.links.update((current) =>
          current.filter((item) => !(item.target_type === link.target_type && item.target_id === link.target_id))
        );
      },
      error: () => {
        this.error.set('Could not remove attachment.');
      },
    });
  }

  toggleArchive(): void {
    const note = this.activeNote();
    if (!note || this.archivePending()) {
      return;
    }

    this.archivePending.set(true);
    this.error.set(null);

    const nextStatus: NoteStatus = note.status === 'archived' ? 'inbox' : 'archived';

    const request$ = nextStatus === 'archived'
      ? this.notesApi.archiveNote(note.id)
      : this.notesApi.unarchiveNote(note.id);

    request$.pipe(
      take(1),
      finalize(() => this.archivePending.set(false))
    ).subscribe({
      next: (response) => {
        const merged: NoteDetail = {
          ...note,
          ...(response ?? {}),
          status: nextStatus,
          links: this.links(),
        };

        this.activeNote.set(merged);
        this.noteStatusChanged.emit(merged);
      },
      error: () => {
        this.error.set('Could not update archive state.');
      },
    });
  }

  chipIcon(targetType: NoteLink['target_type']): string {
    switch (targetType) {
      case 'quran_word':
        return 'W';
      case 'ar_u_lexicon':
        return 'L';
      case 'wv_concept':
        return 'C';
      case 'quran_ayah':
      default:
        return 'A';
    }
  }

  trackLink(_: number, link: NoteLink): string {
    return `${link.target_type}:${link.target_id}`;
  }

  trackComment(_: number, comment: NoteComment): string {
    return comment.id;
  }

  refreshComments(): void {
    const noteId = this.activeNote()?.id;
    if (!noteId) {
      return;
    }

    this.loadComments(noteId).pipe(take(1)).subscribe();
  }

  submitComment(): void {
    const note = this.activeNote();
    const body = this.commentControl.value.trim();
    if (!note || !body || this.commentsSubmitting()) {
      return;
    }

    this.commentsSubmitting.set(true);
    this.commentsError.set(null);

    this.notesApi.createComment({
      target_type: 'note',
      target_id: note.id,
      body_md: body,
    }).pipe(
      take(1),
      finalize(() => this.commentsSubmitting.set(false))
    ).subscribe({
      next: (comment) => {
        this.comments.update((current) => [comment, ...current]);
        this.commentControl.setValue('', { emitEvent: false });
      },
      error: () => {
        this.commentsError.set('Could not add comment.');
      },
    });
  }

  private loadNote(noteId: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.notesApi.getNote(noteId).pipe(
      switchMap((note) => {
        this.activeNote.set(note);
        this.links.set(note.links ?? []);
        this.commentsError.set(null);

        const body = note.body_md ?? '';
        this.bodyControl.setValue(body, { emitEvent: false });

        this.lastSavedTrimmed.set(body.trim());
        this.saveState.set('saved');
        this.commentControl.setValue('', { emitEvent: false });
        return this.loadComments(note.id).pipe(map(() => note));
      }),
      catchError(() => {
        this.activeNote.set(null);
        this.links.set([]);
        this.comments.set([]);
        this.commentsError.set(null);
        this.bodyControl.setValue('', { emitEvent: false });
        this.commentControl.setValue('', { emitEvent: false });
        this.saveState.set('error');
        this.error.set('Could not load this note.');
        return of(null);
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  private persistBody(raw: string, trimmed: string) {
    const note = this.activeNote();
    if (!note) {
      return of(null);
    }

    this.saveState.set('saving');

    const payload = {
      body_md: raw,
      title: computeTitleFromMarkdown(raw),
    };

    return this.notesApi.updateNote(note.id, payload).pipe(
      tap((updated) => {
        const merged: NoteDetail = {
          ...note,
          ...updated,
          body_md: raw,
          title: payload.title,
          updated_at: updated.updated_at ?? new Date().toISOString(),
          links: this.links(),
        };

        this.activeNote.set(merged);
        this.lastSavedTrimmed.set(trimmed);
        this.saveState.set('saved');
        this.notePatched.emit(merged);
      }),
      catchError(() => {
        this.saveState.set('error');
        this.error.set('Could not save this note.');
        return of(null);
      })
    );
  }

  private loadComments(noteId: string) {
    this.commentsLoading.set(true);
    this.commentsError.set(null);

    return this.notesApi.getComments('note', noteId).pipe(
      tap((comments) => {
        this.comments.set(comments);
      }),
      catchError(() => {
        this.comments.set([]);
        this.commentsError.set('Could not load comments.');
        return of([]);
      }),
      finalize(() => {
        this.commentsLoading.set(false);
      })
    );
  }

  private resetEditor(): void {
    this.error.set(null);
    this.saveState.set('idle');
    this.activeNote.set(null);
    this.links.set([]);
    this.comments.set([]);
    this.commentsLoading.set(false);
    this.commentsSubmitting.set(false);
    this.commentsError.set(null);
    this.bodyControl.setValue('', { emitEvent: false });
    this.commentControl.setValue('', { emitEvent: false });
    this.lastSavedTrimmed.set('');
    this.attachDialogOpen.set(false);
    this.loading.set(false);
  }
}
