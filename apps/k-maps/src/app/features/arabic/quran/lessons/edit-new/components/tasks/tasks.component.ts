import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
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
export class TasksComponent implements OnChanges {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly primaryTaskTypes: TaskType[] = ['reading', 'sentence_structure'];
  @Input() readOnly = false;
  @Input() readOnlyActiveTabId: 'lesson' | TaskType = 'lesson';
  private readonly readOnlyTabOrder: Array<'lesson' | TaskType> = [
    'lesson',
    'reading',
    'morphology',
    'sentence_structure',
    'comprehension',
    'passage_structure',
  ];
  private selectedReadOnlyTabId: 'lesson' | TaskType = 'lesson';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['readOnlyActiveTabId'] && this.readOnly) {
      this.selectedReadOnlyTabId = this.readOnlyActiveTabId;
    }
  }

  get state(): EditorState {
    return this.facade.state;
  }

  get activeTaskTab(): TaskTab | null {
    return this.facade.getActiveTaskTab();
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.facade.state);
  }

  get activeTabId(): string {
    if (!this.readOnly) return this.state.activeTaskType;
    return this.selectedReadOnlyTabId;
  }

  get navPrimaryIds(): string[] {
    if (!this.readOnly) return this.primaryTaskTypes;
    return this.taskTabsForNav.map((tab) => tab.id);
  }

  get taskTabsForNav(): AppTabItem[] {
    if (this.readOnly) {
      return this.readOnlyTabOrder.map((id) => ({
        id,
        label:
          id === 'lesson'
            ? 'Lesson'
            : this.state.taskTabs.find((tab) => tab.type === id)?.label.replace('_', ' ') ?? this.toTitle(id),
      }));
    }

    return this.state.taskTabs.map((tab) => ({
      id: tab.type,
      label: tab.label,
    }));
  }

  onTaskTabChange(tab: AppTabItem) {
    if (this.readOnly) {
      const id = tab.id as 'lesson' | TaskType;
      this.selectedReadOnlyTabId = id;
      if (id !== 'lesson') {
        this.facade.selectTaskTab(id);
      }
      return;
    }
    this.facade.selectTaskTab(tab.id as TaskType);
  }

  get lessonHeading(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['heading', 'title', 'study_heading', 'lesson_heading']) || this.state.lessonTitleEn || 'Lesson';
  }

  get lessonDetail(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['detail', 'description', 'summary', 'overview']) || 'No lesson detail available yet.';
  }

  get episodeIntro(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['episode_intro', 'episodeIntro', 'intro']) || 'Not provided';
  }

  get sceneDetail(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['scene', 'scene_intro', 'scene_detail']) || 'Not provided';
  }

  get sceneAesthetic(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['scene_aesthetic', 'aesthetic', 'style', 'tone']) || 'Not provided';
  }

  private getPassageStructurePayload(): Record<string, unknown> {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'passage_structure');
    if (!tab?.json?.trim()) return {};
    try {
      const parsed = JSON.parse(tab.json);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private pickFirst(payload: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        const text = ['text', 'value', 'label', 'title', 'description']
          .map((nestedKey) => nested[nestedKey])
          .find((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
        if (text) return text.trim();
      }
    }
    return '';
  }

  private toTitle(value: string): string {
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
