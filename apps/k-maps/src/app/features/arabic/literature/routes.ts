import { Routes } from '@angular/router';

import { ArLessonsPageComponent } from '../lessons-list/ar-lessons-page/ar-lessons-page.component';
import { LiteratureLessonEditorComponent } from './lessons/edit/literature-lesson-editor.component';
import { LiteratureLessonStudyShellComponent } from './lessons/study/literature-lesson-study-shell.component';
import { LiteratureLessonViewShellComponent } from './lessons/view/literature-lesson-view-shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'lessons' },
  {
    path: 'lessons',
    data: { title: 'Literature Lessons' },
    children: [
      {
        path: '',
        component: ArLessonsPageComponent,
        data: { title: 'Literature Lessons', lessonType: 'literature', lockLessonType: true },
      },
      {
        path: 'new',
        component: LiteratureLessonEditorComponent,
        data: { title: 'New Literature Lesson', lessonType: 'literature' },
      },
      { path: ':id/view', component: LiteratureLessonViewShellComponent },
      { path: ':id/edit', component: LiteratureLessonEditorComponent },
      { path: ':id/study', component: LiteratureLessonStudyShellComponent },
    ],
  },
];
