import { Routes } from '@angular/router';

export const NOTES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inbox',
  },
  {
    path: 'inbox',
    loadComponent: () => import('./inbox.page').then((m) => m.InboxPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./editor.page').then((m) => m.EditorPage),
  },
];
