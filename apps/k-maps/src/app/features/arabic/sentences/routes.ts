import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sentences.component').then(m => m.SentencesComponent),
    data: { title: 'Sentences' },
  },
];
