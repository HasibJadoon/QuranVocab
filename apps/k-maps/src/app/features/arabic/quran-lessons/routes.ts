import { Routes } from '@angular/router';
import { QuranLessonEditorComponent } from './edit/quran-lesson-editor.component';
import { QuranLessonStudyComponent } from './study/quran-lesson-study.component';
import { QuranLessonViewComponent } from './view/quran-lesson-view.component';

export const quranLessonRoutes: Routes = [
  {
    path: '',
    children: [
      { path: ':id/view', component: QuranLessonViewComponent },
      { path: ':id/edit', component: QuranLessonEditorComponent },
      { path: ':id/study', component: QuranLessonStudyComponent }
    ]
  }
];
