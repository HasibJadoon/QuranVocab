import { Routes } from '@angular/router';
import { QuranLessonEditorComponent } from './edit/quran-lesson-editor.component';
import { QuranLessonStudyComponent } from './study/quran-lesson-study.component';
import { QuranLessonViewComponent } from './view/quran-lesson-view.component';
import { QuranSectionListComponent } from './sections/list/quran-section-list.component';
import { QuranSectionViewComponent } from './sections/view/quran-section-view.component';
import { QuranSectionEditComponent } from './sections/edit/quran-section-edit.component';
import { QuranSectionStudyComponent } from './sections/study/quran-section-study.component';

export const quranLessonRoutes: Routes = [
  {
    path: '',
    children: [
      { path: ':id/view', component: QuranLessonViewComponent },
      { path: ':id/edit', component: QuranLessonEditorComponent },
      { path: ':id/study', component: QuranLessonStudyComponent },
      {
        path: 'sections',
        children: [
          { path: '', component: QuranSectionListComponent },
          { path: 'view/:sectionId', component: QuranSectionViewComponent },
          { path: 'edit/:sectionId', component: QuranSectionEditComponent },
          { path: 'study/:sectionId', component: QuranSectionStudyComponent }
        ]
      }
    ]
  }
];
