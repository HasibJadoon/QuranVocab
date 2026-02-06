import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiteratureSectionListComponent } from '../sections/list/literature-section-list.component';

@Component({
  selector: 'app-literature-lesson-study-shell',
  standalone: true,
  imports: [CommonModule, LiteratureSectionListComponent],
  template: `<app-literature-section-list></app-literature-section-list>`
})
export class LiteratureLessonStudyShellComponent {}
