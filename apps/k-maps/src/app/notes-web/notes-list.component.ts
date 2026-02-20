import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Note, NoteStatus, computePreview, computeTitleFromMarkdown } from './notes.models';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
})
export class NotesListComponent implements OnInit, OnChanges {
  @Input() notes: Note[] = [];
  @Input() selectedId: string | null = null;
  @Input() status: NoteStatus = 'inbox';
  @Input() query = '';
  @Input() loading = false;
  @Input() creating = false;

  @Output() readonly statusChanged = new EventEmitter<NoteStatus>();
  @Output() readonly queryChanged = new EventEmitter<string>();
  @Output() readonly noteSelected = new EventEmitter<string>();
  @Output() readonly createRequested = new EventEmitter<void>();

  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.searchControl.setValue(this.query, { emitEvent: false });

    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      map((value) => value.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => this.queryChanged.emit(value));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['query']) {
      return;
    }

    if (this.query !== this.searchControl.value) {
      this.searchControl.setValue(this.query, { emitEvent: false });
    }
  }

  setStatus(status: NoteStatus): void {
    if (status === this.status) {
      return;
    }

    this.statusChanged.emit(status);
  }

  selectNote(noteId: string): void {
    this.noteSelected.emit(noteId);
  }

  requestCreate(): void {
    this.createRequested.emit();
  }

  titleFor(note: Note): string {
    return note.title?.trim() || computeTitleFromMarkdown(note.body_md) || 'Untitled';
  }

  previewFor(note: Note): string {
    return computePreview(note.body_md, 100) || 'Empty note';
  }

  trackById(_: number, note: Note): string {
    return note.id;
  }
}
