import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { LessonSection } from '../models/arabic/lesson-section.model';
import { SECTION_DATA } from '../data/lesson-sections.data';

@Injectable({ providedIn: 'root' })
export class QuranLessonSectionsService {
  list(): Observable<LessonSection[]> {
    return of(SECTION_DATA.filter((section) => section.feature === 'quran'));
  }

  get(sectionId: string): Observable<LessonSection | undefined> {
    return of(
      SECTION_DATA.find((section) => section.feature === 'quran' && section.id === sectionId)
    );
  }
}
