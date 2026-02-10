import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

type Step = {
  id: string;
  label: string;
  intent: string;
};

@Component({
  selector: 'app-quran-lesson-editor-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quran-lesson-editor-new.component.html',
  styleUrls: ['./quran-lesson-editor-new.component.scss'],
})
export class QuranLessonEditorNewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  lessonId: string | null = null;
  isNew = true;

  steps: Step[] = [
    { id: 'meta', label: 'Lesson Meta', intent: 'Name the lesson and define intent.' },
    { id: 'verses', label: 'Verse Range', intent: 'Choose the ayah span for this lesson.' },
    { id: 'container', label: 'Container', intent: 'Attach or create a Quran container.' },
    { id: 'units', label: 'Units', intent: 'Build the unit map (passage + ayat).' },
    { id: 'tokens', label: 'Tokens', intent: 'Capture token-level analysis.' },
    { id: 'spans', label: 'Spans', intent: 'Group phrases and spans.' },
    { id: 'sentences', label: 'Sentences', intent: 'Define sentence boundaries.' },
    { id: 'content', label: 'Content', intent: 'Add comprehension prompts.' },
    { id: 'review', label: 'Review', intent: 'Validate and publish.' },
  ];

  activeStepIndex = 0;

  lessonTitle = '';
  lessonNote = '';
  metaJson = '{\n  \"status\": \"draft\"\n}';

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.lessonId = idParam;
      this.isNew = false;
    }
  }

  get activeStep() {
    return this.steps[this.activeStepIndex];
  }

  selectStep(index: number) {
    if (index < 0 || index >= this.steps.length) return;
    this.activeStepIndex = index;
  }

  prevStep() {
    this.selectStep(this.activeStepIndex - 1);
  }

  nextStep() {
    this.selectStep(this.activeStepIndex + 1);
  }

  clearDraft() {
    this.lessonTitle = '';
    this.lessonNote = '';
    this.metaJson = '{\n  \"status\": \"draft\"\n}';
    this.activeStepIndex = 0;
  }

  back() {
    this.router.navigate(['/arabic/quran/lessons']);
  }
}
