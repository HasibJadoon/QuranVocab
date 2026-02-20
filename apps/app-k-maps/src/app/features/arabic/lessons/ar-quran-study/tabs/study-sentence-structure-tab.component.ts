import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TargetedNotesPanelComponent } from '../../../../../notes/targeting/targeted-notes-panel/targeted-notes-panel.component';
import { TargetRef, makeTaskItemTarget, makeTaskTarget } from '../../../../../notes/targeting/targeting.models';

import { StudySentenceEntry } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-sentence-structure-tab',
  standalone: true,
  imports: [CommonModule, IonicModule, TargetedNotesPanelComponent],
  templateUrl: './study-sentence-structure-tab.component.html',
})
export class StudySentenceStructureTabComponent implements OnChanges {
  @Input() entries: StudySentenceEntry[] = [];
  @Input() unitId = '';
  @Input() rangeRef = '';

  taskTarget: TargetRef | null = null;
  activeSentenceId: string | null = null;
  activeSentenceTarget: TargetRef | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unitId'] || changes['rangeRef']) {
      this.taskTarget = this.buildTaskTarget();
      if (this.activeSentenceId) {
        const activeSentence = this.entries.find((entry) => entry.id === this.activeSentenceId);
        this.activeSentenceTarget = activeSentence ? this.buildSentenceItemTarget(activeSentence) : null;
      }
    }
  }

  toggleSentenceNotes(event: Event, sentence: StudySentenceEntry): void {
    event.stopPropagation();

    if (this.activeSentenceId === sentence.id) {
      this.activeSentenceId = null;
      this.activeSentenceTarget = null;
      return;
    }

    this.activeSentenceId = sentence.id;
    this.activeSentenceTarget = this.buildSentenceItemTarget(sentence);
  }

  private buildTaskTarget(): TargetRef | null {
    const unit = this.unitId.trim();
    if (!unit) return null;

    const range = this.rangeRef.trim();
    const refText = range ? `${range} • sentence_structure` : 'sentence_structure';

    try {
      return makeTaskTarget(unit, 'sentence_structure', refText);
    } catch {
      return null;
    }
  }

  private buildSentenceItemTarget(sentence: StudySentenceEntry): TargetRef | null {
    const unit = this.unitId.trim();
    if (!unit) return null;

    const order = sentence.order > 0 ? sentence.order : 1;
    const itemKey = `sent_${order}`;
    const range = this.rangeRef.trim();
    const refText = range ? `${range} • Sentence #${order}` : `Sentence #${order}`;

    try {
      return makeTaskItemTarget(unit, 'sentence_structure', itemKey, refText);
    } catch {
      return null;
    }
  }
}
