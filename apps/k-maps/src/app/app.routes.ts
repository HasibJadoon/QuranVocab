import { Routes } from '@angular/router';
import { AuthGuard } from '../services/auth.guard';
import { RootRedirectGuard } from '../services/root-redirect.guard';

export const routes: Routes = [
  // 👇 Root entry decision
  {
    path: '',
    canActivate: [RootRedirectGuard],
    component: class EmptyComponent {}
  },

  // 🔓 Public login
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then(m => m.LoginComponent),
  },

  // 🔐 Protected layout
  {
    path: '',
    loadComponent: () =>
      import('./core/layout').then(m => m.DefaultLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/routes').then(m => m.routes),
      },
      {
        path: 'roots',
        loadChildren: () =>
          import('./features/arabic/roots/routes').then(m => m.routes),
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
        path: 'crossref',
        loadChildren: () =>
          import('./features/crossref/routes').then(m => m.routes),
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
      }
    ]
  },

  { path: '**', redirectTo: '' }
];




// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: '',
//     redirectTo: 'dashboard',
//     pathMatch: 'full'
//   },
//   {
//     path: '',
//     loadComponent: () => import('./core/layout').then(m => m.DefaultLayoutComponent),
//     data: {
//       title: 'Home'
//     },
//     children: [
//       {
//         path: 'dashboard',
//         loadChildren: () => import('./quran-app/dashboard/routes').then((m) => m.routes)
//       },
//       {
//         path: 'theme',
//         loadChildren: () => import('./core/views/theme/routes').then((m) => m.routes)
//       },
//       {
//         path: 'base',
//         loadChildren: () => import('./core/views/base/routes').then((m) => m.routes)
//       },
//       {
//         path: 'buttons',
//         loadChildren: () => import('./core/views/buttons/routes').then((m) => m.routes)
//       },
//       {
//         path: 'forms',
//         loadChildren: () => import('./core/views/forms/routes').then((m) => m.routes)
//       },
//       {
//         path: 'icons',
//         loadChildren: () => import('./core/views/icons/routes').then((m) => m.routes)
//       },
//       {
//         path: 'notifications',
//         loadChildren: () => import('./core/views/notifications/routes').then((m) => m.routes)
//       },
//       {
//         path: 'widgets',
//         loadChildren: () => import('./core/views/widgets/routes').then((m) => m.routes)
//       },
//       {
//         path: 'charts',
//         loadChildren: () => import('./core/views/charts/routes').then((m) => m.routes)
//       },
//       {
//         path: 'pages',
//         loadChildren: () => import('./core/views/pages/routes').then((m) => m.routes)
//       }
//     ]
//   },
//   {
//     path: '404',
//     loadComponent: () => import('./core/views/pages/page404/page404.component').then(m => m.Page404Component),
//     data: {
//       title: 'Page 404'
//     }
//   },
//   {
//     path: '500',
//     loadComponent: () => import('./core/views/pages/page500/page500.component').then(m => m.Page500Component),
//     data: {
//       title: 'Page 500'
//     }
//   },
//   {
//     path: 'login',
//     loadComponent: () => import('./core/views/pages/login/login.component').then(m => m.LoginComponent),
//     data: {
//       title: 'Login Page'
//     }
//   },
//   {
//     path: 'register',
//     loadComponent: () => import('./core/views/pages/register/register.component').then(m => m.RegisterComponent),
//     data: {
//       title: 'Register Page'
//     }
//   },
//   { path: '**', redirectTo: 'dashboard' }
// ];
