import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AppTabsComponent, type AppTabItem } from '../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../facade/editor.facade';
import { EditorState, TaskTab, TaskType } from '../../models/editor.types';
import { selectSelectedRangeLabelShort } from '../../state/editor.selectors';
import { ReaderTaskComponent } from './reading-task/reading-task.component';
import { SentenceStructureTaskComponent } from './sentence-structure-task/sentence-structure-task.component';
import { MorphologyTaskComponent } from './morphology-task/morphology-task.component';
import { GrammarConceptsTaskComponent } from './grammar-concepts-task/grammar-concepts-task.component';
import { ExpressionsTaskComponent } from './expressions-task/expressions-task.component';
import { ComprehensionTaskComponent } from './comprehension-task/comprehension-task.component';
import { PassageStructureTaskComponent } from './passage-structure-task/passage-structure-task.component';

@Component({
  selector: 'app-quran-lesson-tasks',
  standalone: true,
  imports: [
    CommonModule,
    AppTabsComponent,
    ReaderTaskComponent,
    SentenceStructureTaskComponent,
    MorphologyTaskComponent,
    GrammarConceptsTaskComponent,
    ExpressionsTaskComponent,
    ComprehensionTaskComponent,
    PassageStructureTaskComponent,
  ],
  templateUrl: './tasks.component.html',
})
export class TasksComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly primaryTaskTypes: TaskType[] = ['reading', 'sentence_structure'];

  get state(): EditorState {
    return this.facade.state;
  }

  get activeTaskTab(): TaskTab | null {
    return this.facade.getActiveTaskTab();
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.facade.state);
  }

  get taskTabsForNav(): AppTabItem[] {
    return this.state.taskTabs.map((tab) => ({
      id: tab.type,
      label: tab.label,
    }));
  }

  onTaskTabChange(tab: AppTabItem) {
    this.facade.selectTaskTab(tab.id as TaskType);
  }
}
