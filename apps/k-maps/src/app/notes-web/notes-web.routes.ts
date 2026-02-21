import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
  {
    path: 'inbox',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
  {
    path: 'published',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
  {
    path: 'archived',
    redirectTo: 'published',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () => import('./notes-shell.component').then((m) => m.NotesShellComponent),
    data: { title: 'Notes' },
  },
];
