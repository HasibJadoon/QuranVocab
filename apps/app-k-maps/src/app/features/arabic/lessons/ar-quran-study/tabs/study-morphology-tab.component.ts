import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { StudyMorphologyItem } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-morphology-tab',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './study-morphology-tab.component.html',
})
export class StudyMorphologyTabComponent {
  @Input() nouns: StudyMorphologyItem[] = [];
  @Input() verbs: StudyMorphologyItem[] = [];
}
