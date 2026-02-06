import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./grammar.component').then(m => m.GrammarComponent),
    data: { title: 'Grammar' },
  },
];
