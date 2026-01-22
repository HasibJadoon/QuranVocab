import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { LessonSection } from '../models/arabic/lesson-section.model';
import { SECTION_DATA } from '../data/lesson-sections.data';

@Injectable({ providedIn: 'root' })
export class LiteratureLessonSectionsService {
  list(): Observable<LessonSection[]> {
    return of(SECTION_DATA.filter((section) => section.feature === 'literature'));
  }
}
