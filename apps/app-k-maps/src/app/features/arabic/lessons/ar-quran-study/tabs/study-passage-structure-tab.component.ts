import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import {
  PassageAccent,
  PassageRenderer,
  PassageSectionCard,
  PassageTextSegment,
} from '../ar-quran-study.facade';

@Component({
  selector: 'app-study-passage-structure-tab',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './study-passage-structure-tab.component.html',
})
export class StudyPassageStructureTabComponent {
  @Input() headerTitle = '';
  @Input() headerSubtitle = '';
  @Input() sections: PassageSectionCard[] = [];

  @Input() toSegments: (value: string) => PassageTextSegment[] = () => [];
  @Input() resolveIcon: (iconName: string, renderer: PassageRenderer, accent: PassageAccent) => string = () => '';
}
