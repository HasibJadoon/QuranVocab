import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./worldview-lessons-page/worldview-lessons-page.component').then(m => m.WorldviewLessonsPageComponent),
    data: { title: 'Worldview Lessons' }
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./worldview-entry/worldview-entry.component').then(m => m.WorldviewEntryComponent),
    data: { title: 'New Worldview Entry' }
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./worldview-entry/worldview-entry.component').then(m => m.WorldviewEntryComponent),
    data: { title: 'Edit Worldview Entry' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./worldview-entry/worldview-entry.component').then(m => m.WorldviewEntryComponent),
    data: { title: 'Worldview Entry' }
  }
];
