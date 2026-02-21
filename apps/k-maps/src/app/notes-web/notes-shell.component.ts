import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, finalize, of, switchMap, take, tap } from 'rxjs';
import { NoteEditorComponent, NoteDraftEvent } from './note-editor.component';
import { NotesListComponent } from './notes-list.component';
import { NotesApiService } from './notes-api.service';
import { Note, NoteStatus, computeTitleFromMarkdown } from './notes.models';

@Component({
  selector: 'app-notes-shell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotesListComponent, NoteEditorComponent],
  templateUrl: './notes-shell.component.html',
  styleUrls: ['./notes-shell.component.scss'],
})
export class NotesShellComponent {
  @ViewChild(NoteEditorComponent) private editorComponent?: NoteEditorComponent;

  private readonly notesApi = inject(NotesApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly status$ = new BehaviorSubject<NoteStatus>('inbox');
  private readonly query$ = new BehaviorSubject<string>('');
  private readonly routeStatusAlias: Record<string, NoteStatus> = {
    inbox: 'inbox',
    published: 'archived',
  };

  readonly notes = signal<Note[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly status = signal<NoteStatus>('inbox');
  readonly query = signal('');
  readonly listError = signal<string | null>(null);
  readonly captureOpen = signal(false);
  readonly captureError = signal<string | null>(null);
  readonly routeAlias = signal<string>('');

  readonly captureBodyControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.route.url.pipe(
      tap((segments) => {
        const alias = segments[0]?.path ?? '';
        this.routeAlias.set(alias);
        this.applyStatusFromAlias(alias);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    this.route.paramMap.pipe(
      tap((params) => {
        const noteId = params.get('id');
        this.selectedId.set(noteId);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    combineLatest([this.status$, this.query$]).pipe(
      switchMap(([status, query]) => {
        this.loading.set(true);
        this.listError.set(null);

        return this.notesApi.listNotes(status, query).pipe(
          catchError((error) => {
            this.listError.set(this.readHttpError(error, 'Could not load notes.'));
            return of([] as Note[]);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((items) => {
      this.notes.set(items);

      const selected = this.selectedId();
      if (!selected && items.length > 0 && !this.isStatusAliasRoute(this.routeAlias())) {
        void this.router.navigate(['/notes', items[0].id], { replaceUrl: true });
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'n') {
      event.preventDefault();
      this.openCaptureModal();
      return;
    }

    if (key === 's') {
      event.preventDefault();
      this.editorComponent?.forceSave();
      return;
    }

    if (key === 'k') {
      event.preventDefault();
      this.editorComponent?.openAttachDialog();
    }
  }

  openCaptureModal(): void {
    this.captureError.set(null);
    this.captureBodyControl.setValue('', { emitEvent: false });
    this.captureOpen.set(true);
  }

  closeCaptureModal(): void {
    if (this.creating()) {
      return;
    }

    this.captureOpen.set(false);
    this.captureError.set(null);
  }

  submitCaptureNote(): void {
    const body = this.captureBodyControl.value.trim();
    if (!body || this.creating()) {
      return;
    }

    this.creating.set(true);
    this.captureError.set(null);

    this.notesApi.createNote({
      body_md: body,
      title: computeTitleFromMarkdown(body) || null,
      status: 'inbox',
    }).pipe(
      take(1),
      finalize(() => this.creating.set(false))
    ).subscribe({
      next: (note) => {
        this.captureOpen.set(false);
        this.captureBodyControl.setValue('', { emitEvent: false });

        if (this.status() !== 'inbox') {
          this.status.set('inbox');
          this.status$.next('inbox');
        }

        this.upsertNote(note);
        void this.router.navigate(['/notes', note.id]);
      },
      error: (error) => {
        this.captureError.set(this.readHttpError(error, 'Could not capture note.'));
      },
    });
  }

  onCaptureKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCaptureModal();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      this.submitCaptureNote();
    }
  }

  onStatusChanged(status: NoteStatus): void {
    this.status.set(status);
    this.status$.next(status);

    if (!this.selectedId()) {
      const alias = status === 'archived' ? 'published' : 'inbox';
      if (this.routeAlias() !== alias) {
        void this.router.navigate(['/notes', alias], { replaceUrl: true });
      }
    }
  }

  onQueryChanged(query: string): void {
    this.query.set(query);
    this.query$.next(query);
  }

  selectNote(noteId: string): void {
    void this.router.navigate(['/notes', noteId]);
  }

  createNote(): void {
    this.openCaptureModal();
  }

  onDraftChanged(event: NoteDraftEvent): void {
    this.notes.update((items) => items.map((note) => {
      if (note.id !== event.id) {
        return note;
      }

      return {
        ...note,
        body_md: event.body_md,
        title: event.title,
        updated_at: event.updated_at,
      };
    }));
  }

  onNotePatched(note: Note): void {
    this.upsertNote(note);
  }

  onNoteStatusChanged(note: Note): void {
    if (note.status !== this.status()) {
      this.notes.update((items) => items.filter((item) => item.id !== note.id));

      if (this.selectedId() === note.id) {
        void this.router.navigate(['/notes']);
      }

      return;
    }

    this.upsertNote(note);
  }

  private upsertNote(note: Note): void {
    if (note.status !== this.status()) {
      return;
    }

    this.notes.update((items) => {
      const index = items.findIndex((item) => item.id === note.id);
      if (index === -1) {
        return [note, ...items];
      }

      const next = [...items];
      next[index] = { ...next[index], ...note };
      return next;
    });
  }

  private readHttpError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      void this.router.navigate(['/login']);
      return 'Session expired. Please sign in again.';
    }

    return fallback;
  }

  private applyStatusFromAlias(alias: string): void {
    const mapped = this.routeStatusAlias[alias];
    if (!mapped || mapped === this.status()) {
      return;
    }

    this.status.set(mapped);
    this.status$.next(mapped);
  }

  private isStatusAliasRoute(alias: string): boolean {
    return alias in this.routeStatusAlias;
  }
}
