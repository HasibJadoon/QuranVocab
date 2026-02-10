import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuranLessonEditorFacade } from '../../facade/editor.facade';
import { EditorState } from '../../models/editor.types';
import { selectReferenceLabel, selectSelectedRangeLabel, selectSurahName } from '../../state/editor.selectors';

@Component({
  selector: 'app-quran-lesson-lesson',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lesson.component.html',
})
export class LessonComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly difficultyLevels = [1, 2, 3, 4, 5];

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedRangeLabel() {
    return selectSelectedRangeLabel(this.facade.state);
  }

  get surahName() {
    return selectSurahName(this.facade.state);
  }

  get referenceLabel() {
    return selectReferenceLabel(this.facade.state);
  }

  setDifficulty(level: number) {
    this.facade.setDifficulty(level);
  }

  saveLessonMeta() {
    this.facade.saveLessonMeta();
  }
}
