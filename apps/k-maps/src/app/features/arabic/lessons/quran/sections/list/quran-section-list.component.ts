import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuranLessonSectionsService } from '../../../../../../shared/services/quran-lesson-sections.service';

@Component({
  selector: 'app-quran-section-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quran-section-list.component.html',
  styleUrls: ['./quran-section-list.component.scss']
})
export class QuranSectionListComponent {
  private sections = inject(QuranLessonSectionsService);
  sections$ = this.sections.list();
}
