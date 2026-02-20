import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { StudyReadingAyah } from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-reading-tab',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './study-reading-tab.component.html',
})
export class StudyReadingTabComponent {
  @Input() ayahs: StudyReadingAyah[] = [];
}
