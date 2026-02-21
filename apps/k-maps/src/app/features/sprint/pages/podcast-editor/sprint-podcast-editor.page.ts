import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CaptureNoteMeta, PodcastEpisode } from '../../models/sprint.models';
import { CaptureNotesService } from '../../services/capture-notes.service';
import { PodcastService } from '../../services/podcast.service';
import { computeWeekStartSydney } from '../../utils/week-start.util';

type OutlineItem = {
  id: string;
  title: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

@Component({
  selector: 'app-sprint-podcast-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sprint-podcast-editor.page.html',
  styleUrl: './sprint-podcast-editor.page.scss',
})
export class SprintPodcastEditorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly podcastService = inject(PodcastService);
  private readonly captureNotes = inject(CaptureNotesService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  readonly ideaControl = new FormControl('', { nonNullable: true });
  readonly outlineInputControl = new FormControl('', { nonNullable: true });
  readonly checklistInputControl = new FormControl('', { nonNullable: true });

  episode: PodcastEpisode | null = null;
  outline: OutlineItem[] = [];
  checklist: ChecklistItem[] = [];
  scriptText = '';
  refsJsonText = '{}';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.error.set('Podcast id is required.');
        this.loading.set(false);
        return;
      }
      void this.load(id);
    });
  }

  addOutlineItem(): void {
    const title = this.outlineInputControl.value.trim();
    if (!title) {
      return;
    }
    this.outline = [
      ...this.outline,
      { id: crypto.randomUUID(), title },
    ];
    this.outlineInputControl.setValue('', { emitEvent: false });
  }

  moveOutline(index: number, delta: -1 | 1): void {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= this.outline.length) {
      return;
    }
    const next = [...this.outline];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    this.outline = next;
  }

  removeOutline(index: number): void {
    this.outline = this.outline.filter((_, currentIndex) => currentIndex !== index);
  }

  addChecklistItem(): void {
    const label = this.checklistInputControl.value.trim();
    if (!label) {
      return;
    }

    this.checklist = [
      ...this.checklist,
      {
        id: crypto.randomUUID(),
        label,
        done: false,
      },
    ];
    this.checklistInputControl.setValue('', { emitEvent: false });
  }

  removeChecklist(index: number): void {
    this.checklist = this.checklist.filter((_, currentIndex) => currentIndex !== index);
  }

  async captureIdea(): Promise<void> {
    const text = this.ideaControl.value.trim();
    if (!text || !this.episode) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const meta: CaptureNoteMeta = {
        schema_version: 1,
        kind: 'capture',
        week_start: computeWeekStartSydney(),
        source: 'podcast',
        related_type: 'wv_content_item',
        related_id: this.episode.id,
      };

      await firstValueFrom(this.captureNotes.create({
        text,
        title: summarize(text),
        meta,
      }));
      this.ideaControl.setValue('', { emitEvent: false });
    } catch {
      this.error.set('Could not capture podcast idea.');
    } finally {
      this.saving.set(false);
    }
  }

  async save(): Promise<void> {
    if (!this.episode) {
      return;
    }

    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);

    try {
      const refs = parseJsonRecord(this.refsJsonText);
      if (!refs) {
        this.error.set('refs_json must be valid JSON object.');
        this.saving.set(false);
        return;
      }

      const contentJson = {
        ...(this.episode.content_json ?? {}),
        outline_sections: this.outline,
        script_md: this.scriptText,
        checklist: this.checklist,
      };

      const updated = await firstValueFrom(
        this.podcastService.save(this.episode.id, {
          title: this.episode.title,
          status: this.episode.status,
          related_type: this.episode.related_type,
          related_id: this.episode.related_id,
          refs_json: refs,
          content_json: contentJson,
        })
      );

      this.episode = updated;
      this.saved.set(true);
    } catch {
      this.error.set('Could not save podcast episode.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.saved.set(false);

    try {
      const item = await firstValueFrom(this.podcastService.get(id));
      this.episode = item;

      this.scriptText = readString(item.content_json['script_md']) ?? '';
      this.outline = toOutlineItems(item.content_json['outline_sections']);
      this.checklist = toChecklistItems(item.content_json['checklist']);
      this.refsJsonText = JSON.stringify(item.refs_json ?? {}, null, 2);
    } catch {
      this.error.set('Could not load podcast episode.');
      this.episode = null;
    } finally {
      this.loading.set(false);
    }
  }
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toOutlineItems(value: unknown): OutlineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const title = entry.trim();
        if (!title) {
          return null;
        }
        return {
          id: `outline-${index + 1}`,
          title,
        };
      }

      if (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
        const record = entry as Record<string, unknown>;
        const title = readString(record['title'])?.trim();
        if (!title) {
          return null;
        }

        return {
          id: readString(record['id']) ?? `outline-${index + 1}`,
          title,
        };
      }

      return null;
    })
    .filter((entry): entry is OutlineItem => entry !== null);
}

function toChecklistItems(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const label = readString(record['label'])?.trim();
      if (!label) {
        return null;
      }

      return {
        id: readString(record['id']) ?? `check-${index + 1}`,
        label,
        done: Boolean(record['done']),
      };
    })
    .filter((entry): entry is ChecklistItem => entry !== null);
}

function parseJsonRecord(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function summarize(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 60) {
    return normalized;
  }
  return `${normalized.slice(0, 57).trimEnd()}...`;
}
