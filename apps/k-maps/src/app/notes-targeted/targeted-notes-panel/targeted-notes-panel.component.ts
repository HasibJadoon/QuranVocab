import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs';
import { TargetedNotesApiService } from '../targeted-notes-api.service';
import { CaptureNote, TargetRef, computeTitleFromMarkdown } from '../targeting.models';

@Component({
  selector: 'app-targeted-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './targeted-notes-panel.component.html',
  styleUrls: ['./targeted-notes-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetedNotesPanelComponent implements OnChanges {
  @Input({ required: true }) target!: TargetRef;

  readonly loading = signal(false);
  readonly adding = signal(false);
  readonly notes = signal<CaptureNote[]>([]);
  readonly error = signal<string | null>(null);

  bodyMd = '';

  private lastTargetKey = '';

  constructor(private readonly targetedNotesApi: TargetedNotesApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['target']) {
      this.refreshIfTargetChanged();
    }
  }

  refresh(): void {
    this.loadNotes();
  }

  addNote(): void {
    if (!this.target || this.adding()) {
      return;
    }

    if (!this.bodyMd.trim()) {
      this.error.set('Write something first.');
      return;
    }

    this.error.set(null);
    this.adding.set(true);

    this.targetedNotesApi.createTargetedNote(this.target, this.bodyMd).pipe(
      take(1),
      finalize(() => this.adding.set(false))
    ).subscribe({
      next: () => {
        this.bodyMd = '';
        this.loadNotes();
      },
      error: (error: Error) => {
        this.error.set(error.message || 'Could not add note.');
      },
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      this.addNote();
    }
  }

  titleFor(note: CaptureNote): string {
    return note.title?.trim() || computeTitleFromMarkdown(note.body_md) || 'Untitled';
  }

  previewFor(note: CaptureNote): string {
    const compact = note.body_md.replace(/\s+/g, ' ').trim();
    if (!compact) {
      return '';
    }

    if (compact.length <= 140) {
      return compact;
    }

    return `${compact.slice(0, 139).replace(/\s+$/, '')}...`;
  }

  trackById(_: number, note: CaptureNote): string {
    return note.id;
  }

  private refreshIfTargetChanged(): void {
    if (!this.target) {
      return;
    }

    const key = `${this.target.target_type}:${this.target.target_id}`;
    if (key === this.lastTargetKey) {
      return;
    }

    this.lastTargetKey = key;
    this.loadNotes();
  }

  private loadNotes(): void {
    if (!this.target) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.targetedNotesApi.listTargetNotes(this.target).pipe(
      take(1),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (notes) => {
        this.notes.set(notes);
      },
      error: (error: Error) => {
        this.notes.set([]);
        this.error.set(error.message || 'Could not load notes.');
      },
    });
  }
}
