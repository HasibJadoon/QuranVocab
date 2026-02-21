import { Routes } from '@angular/router';
import { AuthGuard } from '../services/auth.guard';

export const routes: Routes = [
  // 👇 Root entry decision
  // 🔓 Public login
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin/setup',
    loadComponent: () =>
      import('./features/admin/users/users-page.component').then(m => m.UsersPageComponent),
  },

  // 🔐 Protected layout
  {
    path: '',
    loadComponent: () =>
      import('./core/layout').then(m => m.DefaultLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/routes').then(m => m.routes),
      },
      {
        path: 'arabic',
        loadChildren: () =>
          import('./features/arabic/routes').then(m => m.routes),
      },
      {
        path: 'worldview',
        loadChildren: () =>
          import('./features/worldview/routes').then(m => m.routes),
      },
      {
        path: 'docs',
        loadChildren: () =>
          import('./features/docs/routes').then((m) => m.routes),
      },
      {
        path: 'crossref',
        loadChildren: () =>
          import('./features/crossref/routes').then(m => m.routes),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/routes').then(m => m.routes),
      },
      {
        path: 'podcast/:id',
        loadComponent: () =>
          import('./features/sprint/pages/podcast-editor/sprint-podcast-editor.page').then(
            (m) => m.SprintPodcastEditorPageComponent
          ),
      },
      {
        path: 'podcast',
        loadChildren: () =>
          import('./features/podcast/routes').then(m => m.routes),
      },
      {
        path: 'planner',
        loadChildren: () =>
          import('./features/planner/routes').then(m => m.routes),
      },
      {
        path: 'week',
        loadComponent: () =>
          import('./features/sprint/pages/week-board/sprint-week-board.page').then(
            (m) => m.SprintWeekBoardPageComponent
          ),
      },
      {
        path: 'week/:weekStart',
        loadComponent: () =>
          import('./features/sprint/pages/week-board/sprint-week-board.page').then(
            (m) => m.SprintWeekBoardPageComponent
          ),
      },
      {
        path: 'task/:taskId',
        loadComponent: () =>
          import('./features/sprint/pages/week-board/sprint-week-board.page').then(
            (m) => m.SprintWeekBoardPageComponent
          ),
      },
      {
        path: 'review/:weekStart',
        loadComponent: () =>
          import('./features/sprint/pages/review/sprint-review.page').then(
            (m) => m.SprintReviewPageComponent
          ),
      },
      {
        path: 'lesson/:id',
        loadComponent: () =>
          import('./features/arabic/quran/lessons/study/quran-lesson-study.component').then(
            (m) => m.QuranLessonStudyComponent
          ),
      },
      {
        path: 'notes',
        loadChildren: () =>
          import('./notes-web/notes-web.routes').then((m) => m.routes),
      },
      {
        path: 'discourse',
        loadChildren: () =>
          import('./features/discourse/routes').then(m => m.routes),
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
