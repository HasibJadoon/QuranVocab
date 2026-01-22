import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiteratureLessonSectionsService } from '../../../../../../shared/services/literature-lesson-sections.service';

@Component({
  selector: 'app-literature-section-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './literature-section-list.component.html',
  styleUrls: ['./literature-section-list.component.scss']
})
export class LiteratureSectionListComponent {
  private sections = inject(LiteratureLessonSectionsService);
  sections$ = this.sections.list();
}
