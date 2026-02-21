import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CaptureNoteMeta } from '../../models/sprint.models';
import { CaptureNotesService } from '../../services/capture-notes.service';
import { computeWeekStartSydney } from '../../utils/week-start.util';

@Component({
  selector: 'app-lesson-capture-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lesson-capture-bar.component.html',
  styleUrl: './lesson-capture-bar.component.scss',
})
export class LessonCaptureBarComponent {
  private readonly captureNotes = inject(CaptureNotesService);

  @Input({ required: true }) lessonId = '';
  @Input() containerId: string | null = null;
  @Input() unitId: string | null = null;
  @Input() ref: string | null = null;
  @Input() taskType: string | null = null;
  @Output() readonly saved = new EventEmitter<void>();

  readonly textControl = new FormControl('', { nonNullable: true });
  readonly noteTypeControl = new FormControl('lesson', { nonNullable: true });
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  async save(): Promise<void> {
    const text = this.textControl.value.trim();
    if (!text || !this.lessonId) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const meta: CaptureNoteMeta = {
        schema_version: 1,
        kind: 'capture',
        week_start: computeWeekStartSydney(),
        source: 'lesson',
        related_type: 'ar_lesson',
        related_id: this.lessonId,
        container_id: this.containerId ?? undefined,
        unit_id: this.unitId ?? undefined,
        ref: this.ref ?? undefined,
        task_type: this.taskType ?? this.noteTypeControl.value,
      };

      await firstValueFrom(this.captureNotes.create({
        text,
        title: summarizeTitle(text),
        meta,
      }));
      this.textControl.setValue('', { emitEvent: false });
      this.saved.emit();
    } catch {
      this.error.set('Could not save capture note.');
    } finally {
      this.saving.set(false);
    }
  }
}

function summarizeTitle(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Lesson capture';
  }
  if (compact.length <= 64) {
    return compact;
  }
  return `${compact.slice(0, 61).trimEnd()}...`;
}
