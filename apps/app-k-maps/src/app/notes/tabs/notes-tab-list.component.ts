import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Observable, catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { NotesApiService } from '../notes-api.service';
import { Note, computePreview, computeTitleFromMarkdown } from '../notes.models';

export type NotesTabMode = 'draft' | 'flag' | 'published';

@Component({
  selector: 'app-notes-tab-list',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './notes-tab-list.component.html',
  styleUrls: ['./notes-tab-list.component.scss'],
})
export class NotesTabListComponent implements OnInit {
  @Input({ required: true }) mode: NotesTabMode = 'draft';

  private readonly notesApi = inject(NotesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notes = signal<Note[]>([]);
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      map((params) => (params.get('q') ?? '').trim()),
      distinctUntilChanged(),
      switchMap((query) => this.fetchNotes(query)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onRefresh(event: RefresherCustomEvent): void {
    const query = (this.route.snapshot.queryParamMap.get('q') ?? '').trim();
    this.fetchNotes(query, () => event.target.complete()).pipe(take(1)).subscribe();
  }

  titleFor(note: Note): string {
    return note.title?.trim() || computeTitleFromMarkdown(note.body_md) || 'Untitled';
  }

  previewFor(note: Note): string {
    return computePreview(note.body_md, 100) || 'Tap to start writing...';
  }

  emptyStateTitle(): string {
    if (this.mode === 'published') {
      return 'No published notes';
    }

    if (this.mode === 'flag') {
      return 'No flagged notes';
    }

    return 'No drafts yet';
  }

  emptyStateMessage(): string {
    if (this.mode === 'published') {
      return 'Archive a note in the editor to publish it here.';
    }

    if (this.mode === 'flag') {
      return 'Use #flag in a note to keep it in this tab.';
    }

    return 'Tap + in the header to capture a new note.';
  }

  private fetchNotes(query: string, done?: () => void): Observable<Note[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.listByMode(query).pipe(
      tap((notes) => {
        this.notes.set(notes);
      }),
      catchError((error: unknown) => {
        this.notes.set([]);
        this.error.set(this.toErrorMessage(error));
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        done?.();
      })
    );
  }

  private listByMode(query: string): Observable<Note[]> {
    if (this.mode === 'draft') {
      return this.notesApi.listNotes('inbox', query);
    }

    if (this.mode === 'published') {
      return this.notesApi.listNotes('archived', query);
    }

    return forkJoin([
      this.notesApi.listNotes('inbox', query),
      this.notesApi.listNotes('archived', query),
    ]).pipe(
      map(([inbox, archived]) => {
        return [...inbox, ...archived]
          .filter((note) => this.isFlagged(note))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      })
    );
  }

  private isFlagged(note: Note): boolean {
    const haystack = `${note.title ?? ''}\n${note.body_md}`.toLowerCase();
    return /\B#flag\b/.test(haystack) || /\[flag\]/.test(haystack);
  }

  private toErrorMessage(error: unknown): string {
    const status = this.readStatus(error);
    if (status === 401) {
      return 'Session expired. Please log in again.';
    }

    return 'Could not load notes.';
  }

  private readStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = (error as Record<string, unknown>)['status'];
    if (typeof candidate === 'number') {
      return candidate;
    }

    return null;
  }
}
