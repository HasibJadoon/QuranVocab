import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab, TaskType } from '../../../models/editor.types';

@Component({
  selector: 'app-quran-lesson-task-json',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-json.component.html',
})
export class QuranLessonTaskJsonComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  @Input({ required: true }) taskType!: TaskType;

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
    if (!this.tab) return;
    this.tab.json = value;
  }

  validate() {
    this.facade.validateTaskJson(this.taskType);
  }

  format() {
    this.facade.formatTaskJson(this.taskType);
  }

  save() {
    this.facade.saveTask(this.taskType);
  }
}
