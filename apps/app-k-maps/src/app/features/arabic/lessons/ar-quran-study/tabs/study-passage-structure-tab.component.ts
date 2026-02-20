import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TargetedNotesPanelComponent } from '../../../../../notes/targeting/targeted-notes-panel/targeted-notes-panel.component';
import { TargetRef, makeTaskTarget } from '../../../../../notes/targeting/targeting.models';

import {
  PassageAccent,
  PassageRenderer,
  PassageSectionCard,
  PassageTextSegment,
} from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-passage-structure-tab',
  standalone: true,
  imports: [CommonModule, IonicModule, TargetedNotesPanelComponent],
  templateUrl: './study-passage-structure-tab.component.html',
})
export class StudyPassageStructureTabComponent implements OnChanges {
  @Input() headerTitle = '';
  @Input() headerSubtitle = '';
  @Input() sections: PassageSectionCard[] = [];
  @Input() unitId = '';
  @Input() rangeRef = '';

  @Input() toSegments: (value: string) => PassageTextSegment[] = () => [];
  @Input() resolveIcon: (iconName: string, renderer: PassageRenderer, accent: PassageAccent) => string = () => '';

  taskTarget: TargetRef | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unitId'] || changes['rangeRef']) {
      this.taskTarget = this.buildTaskTarget();
    }
  }

  private buildTaskTarget(): TargetRef | null {
    const unit = this.unitId.trim();
    if (!unit) {
      return null;
    }

    const range = this.rangeRef.trim();
    const refText = range ? `${range} • passage_structure` : 'passage_structure';

    try {
      return makeTaskTarget(unit, 'passage_structure', refText);
    } catch {
      return null;
    }
  }
}
