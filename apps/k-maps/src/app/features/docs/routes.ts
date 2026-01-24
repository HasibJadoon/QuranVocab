import { UrlMatchResult, UrlSegment, Routes } from '@angular/router';

const docsDetailMatcher = (segments: UrlSegment[]): UrlMatchResult | null => {
  if (!segments.length) return null;
  return {
    consumed: segments,
    posParams: {
      slug: new UrlSegment(segments.map((s) => s.path).join('/'), {}),
    },
  };
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./docs-list/docs-list.component').then((m) => m.DocsListComponent),
    data: { title: 'Docs' },
  },
  {
    matcher: docsDetailMatcher,
    loadComponent: () =>
      import('./docs-detail/docs-detail.component').then((m) => m.DocsDetailComponent),
    data: { title: 'Doc' },
  },
];
