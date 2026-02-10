import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { QuranLessonEditorFacade } from '../../facade/editor.facade';
import { EditorState } from '../../models/editor.types';
import { selectReferenceLabel, selectSelectedAyahs, selectSelectedRangeLabelShort } from '../../state/editor.selectors';

@Component({
  selector: 'app-quran-lesson-container-unit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './container-unit.component.html',
})
export class ContainerUnitComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.facade.state);
  }

  get referenceLabel() {
    return selectReferenceLabel(this.facade.state);
  }

  continueToLesson() {
    this.facade.continueToLesson();
  }
}
