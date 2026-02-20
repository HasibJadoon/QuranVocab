import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { ComprehensionQuestionGroup } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-comprehension-tab',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './study-comprehension-tab.component.html',
})
export class StudyComprehensionTabComponent {
  @Input() total = 0;
  @Input() groups: ComprehensionQuestionGroup[] = [];
}
