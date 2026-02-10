import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { QuranLessonEditorFacade } from './facade/editor.facade';
import { EditorState } from './models/editor.types';
import { selectActiveStep } from './state/editor.selectors';
import { ContainerComponent } from './components/container/container.component';
import { ContainerUnitComponent } from './components/container-unit/container-unit.component';
import { LessonComponent } from './components/lesson/lesson.component';
import { TasksComponent } from './components/tasks/tasks.component';

@Component({
  selector: 'app-quran-lesson-editor-new',
  standalone: true,
  imports: [CommonModule, ContainerComponent, ContainerUnitComponent, LessonComponent, TasksComponent],
  templateUrl: './quran-lesson-editor-new.component.html',
  styleUrls: ['./quran-lesson-editor-new.component.scss'],
  providers: [QuranLessonEditorFacade],
})
export class QuranLessonEditorNewComponent implements OnInit, OnDestroy {
  private readonly facade = inject(QuranLessonEditorFacade);

  ngOnInit() {
    this.facade.init();
  }

  ngOnDestroy() {
    this.facade.destroy();
  }

  get state(): EditorState {
    return this.facade.state;
  }

  get activeStep() {
    return selectActiveStep(this.facade.state);
  }

  clearDraft() {
    this.facade.clearDraft();
  }

  back() {
    this.facade.back();
  }
}
