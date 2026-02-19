import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppJsonCodeEditorComponent } from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab, TaskType } from '../../../models/editor.types';

@Component({
  selector: 'app-quran-lesson-task-json',
  standalone: true,
  imports: [CommonModule, FormsModule, AppJsonCodeEditorComponent],
  templateUrl: './task-json.component.html',
})
export class QuranLessonTaskJsonComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  @Input({ required: true }) taskType!: TaskType;
  @Input() readOnly = false;

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === this.taskType) ?? null;
  }

  get jsonValue(): string {
    return this.tab?.json ?? '';
  }

  set jsonValue(value: string) {
    if (this.readOnly) return;
    if (!this.tab) return;
    this.tab.json = value;
  }

  validate() {
    if (this.readOnly) return;
    this.facade.validateTaskJson(this.taskType);
  }

  format() {
    if (this.readOnly) return;
    this.facade.formatTaskJson(this.taskType);
  }

  save() {
    if (this.readOnly) return;
    this.facade.saveTask(this.taskType);
  }
}
