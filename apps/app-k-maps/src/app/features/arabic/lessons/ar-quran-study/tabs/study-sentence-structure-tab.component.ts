import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { StudySentenceEntry } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-sentence-structure-tab',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './study-sentence-structure-tab.component.html',
})
export class StudySentenceStructureTabComponent {
  @Input() entries: StudySentenceEntry[] = [];
}
