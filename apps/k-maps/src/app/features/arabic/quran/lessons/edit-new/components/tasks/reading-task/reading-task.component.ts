import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState } from '../../../models/editor.types';
import { selectSelectedAyahs } from '../../../state/editor.selectors';

@Component({
  selector: 'app-reader-task',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reading-task.component.html',
})
export class ReaderTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
  }

  save() {
    this.facade.saveTask('reading');
  }
}
