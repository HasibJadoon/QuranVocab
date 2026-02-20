import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TargetedNotesPanelComponent } from '../../../../../notes/targeting/targeted-notes-panel/targeted-notes-panel.component';
import { TargetRef, makeTaskItemTarget, makeTaskTarget } from '../../../../../notes/targeting/targeting.models';

import { ComprehensionQuestionGroup } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-comprehension-tab',
  standalone: true,
  imports: [CommonModule, IonicModule, TargetedNotesPanelComponent],
  templateUrl: './study-comprehension-tab.component.html',
})
export class StudyComprehensionTabComponent implements OnChanges {
  @Input() total = 0;
  @Input() groups: ComprehensionQuestionGroup[] = [];
  @Input() unitId = '';
  @Input() rangeRef = '';

  taskTarget: TargetRef | null = null;
  activeQuestionKey = '';
  activeQuestionTarget: TargetRef | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unitId'] || changes['rangeRef']) {
      this.taskTarget = this.buildTaskTarget();
    }
  }

  toggleQuestionNotes(event: Event, groupIndex: number, questionIndex: number): void {
    event.stopPropagation();

    const ordinal = this.questionOrdinal(groupIndex, questionIndex);
    const key = `q_${ordinal}`;

    if (this.activeQuestionKey === key) {
      this.activeQuestionKey = '';
      this.activeQuestionTarget = null;
      return;
    }

    this.activeQuestionKey = key;
    this.activeQuestionTarget = this.buildQuestionTarget(ordinal);
  }

  questionKey(groupIndex: number, questionIndex: number): string {
    return `q_${this.questionOrdinal(groupIndex, questionIndex)}`;
  }

  private buildTaskTarget(): TargetRef | null {
    const unit = this.unitId.trim();
    if (!unit) return null;

    const range = this.rangeRef.trim();
    const refText = range ? `${range} • comprehension` : 'comprehension';

    try {
      return makeTaskTarget(unit, 'comprehension', refText);
    } catch {
      return null;
    }
  }

  private buildQuestionTarget(questionOrdinal: number): TargetRef | null {
    const unit = this.unitId.trim();
    if (!unit) return null;

    const itemKey = `q_${questionOrdinal}`;
    const range = this.rangeRef.trim();
    const refText = range ? `${range} • Q#${questionOrdinal}` : `Q#${questionOrdinal}`;

    try {
      return makeTaskItemTarget(unit, 'comprehension', itemKey, refText);
    } catch {
      return null;
    }
  }

  private questionOrdinal(groupIndex: number, questionIndex: number): number {
    let offset = 0;
    for (let index = 0; index < groupIndex; index += 1) {
      offset += this.groups[index]?.questions?.length ?? 0;
    }
    return offset + questionIndex + 1;
  }
}
