import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, finalize, of, switchMap, take, tap } from 'rxjs';
import { NoteEditorComponent, NoteDraftEvent } from './note-editor.component';
import { NotesListComponent } from './notes-list.component';
import { NotesApiService } from './notes-api.service';
import { Note, NoteStatus } from './notes.models';

@Component({
  selector: 'app-notes-shell',
  standalone: true,
  imports: [CommonModule, NotesListComponent, NoteEditorComponent],
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

  readonly notes = signal<Note[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly status = signal<NoteStatus>('inbox');
  readonly query = signal('');
  readonly listError = signal<string | null>(null);

  constructor() {
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
          catchError(() => {
            this.listError.set('Could not load notes.');
            return of([] as Note[]);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((items) => {
      this.notes.set(items);

      const selected = this.selectedId();
      if (!selected && items.length > 0) {
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
      this.createNote();
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

  onStatusChanged(status: NoteStatus): void {
    this.status.set(status);
    this.status$.next(status);
  }

  onQueryChanged(query: string): void {
    this.query.set(query);
    this.query$.next(query);
  }

  selectNote(noteId: string): void {
    void this.router.navigate(['/notes', noteId]);
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
        if (this.status() !== 'inbox') {
          this.status.set('inbox');
          this.status$.next('inbox');
        }

        this.upsertNote(note);
        void this.router.navigate(['/notes', note.id]);
      },
      error: () => {
        this.listError.set('Could not create a note.');
      },
    });
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
}
