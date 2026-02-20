import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
  {
    path: ':id',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
];
