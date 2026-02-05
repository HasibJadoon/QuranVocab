import { NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs/operators';

import {
  BreadcrumbRouterComponent,
  BreadcrumbRouterService,
  ContainerComponent,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  IBreadcrumbItem,
  SidebarToggleDirective,
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';
import {
  AppHeaderSettingsDropdownComponent,
  AppHeaderbarComponent,
  AppPageHeaderTabsComponent,
} from '../../../../shared/components';
import { PageHeaderService } from '../../../../shared/services/page-header.service';
import { PageHeaderSearchService } from '../../../../shared/services/page-header-search.service';
import { PageHeaderPaginationService } from '../../../../shared/services/page-header-pagination.service';
import {
  PageHeaderFilterChangeEvent,
  PageHeaderPaginationConfig,
  PageHeaderSearchAction,
  PageHeaderSearchConfig,
  PageHeaderTabsConfig,
} from '../../../../shared/models/core/page-header.model';
import { toSignal } from '@angular/core/rxjs-interop';

const SKIPPED_BREADCRUMB_LABELS = new Set(['Arabic Lessons', 'Quran Lessons']);

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrls: ['./default-header.component.scss'],
  imports: [
    ContainerComponent,
    HeaderTogglerDirective,
    SidebarToggleDirective,
    IconDirective,
    HeaderNavComponent,
    NgIf,
    NgFor,
    RouterLink,
    RouterLinkActive,
    BreadcrumbRouterComponent,
    AppHeaderbarComponent,
    AppPageHeaderTabsComponent,
    AppHeaderSettingsDropdownComponent,
  ],
})
export class DefaultHeaderComponent extends HeaderComponent {
  private readonly router = inject(Router);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly pageHeaderSearchService = inject(PageHeaderSearchService);
  private readonly pageHeaderPaginationService = inject(PageHeaderPaginationService);
  private readonly breadcrumbService = inject(BreadcrumbRouterService);

  private readonly breadcrumbsSignal = toSignal(this.breadcrumbService.breadcrumbs$, {
    initialValue: [],
  });

  pageHeaderTabs = toSignal(this.pageHeaderService.tabs$, {
    initialValue: null as PageHeaderTabsConfig | null,
  });

  pageHeaderSearch = toSignal(this.pageHeaderSearchService.config$, {
    initialValue: null as PageHeaderSearchConfig | null,
  });

  pageHeaderPagination = toSignal(this.pageHeaderPaginationService.config$, {
    initialValue: null as PageHeaderPaginationConfig | null,
  });

  sidebarId = input('sidebar1');

  currentUrl = '';
  showHeaderSearch = false;
  headerQuery = '';
  headerPlaceholder = 'Search';
  headerActionLabel = '';
  headerActionKind: 'lesson-new' | 'roots-new' | 'worldview-new' | '' = '';
  headerSecondaryLabel = '';
  headerSecondaryKind: 'refresh' | '' = '';
  showDiscourseFilters = false;
  discourseFilters = [
    { key: 'Epistemology', label: 'Epistemology' },
    { key: 'Law', label: 'Law' },
    { key: 'Morality', label: 'Morality' },
    { key: 'Power', label: 'Power' },
    { key: 'Society', label: 'Society' },
    { key: 'Narrative', label: 'Narrative' },
  ];
  activeDiscourseFilters = new Set<string>();
  private currentPath = '';

  headerTitle = 'k-maps';
  showHeaderTitle = false;
  lessonHeaderTarget: 'quran' | 'literature' = 'quran';

  filteredBreadcrumbs = computed<IBreadcrumbItem[]>(() =>
    this.breadcrumbsSignal().filter((item) => !SKIPPED_BREADCRUMB_LABELS.has(item?.label ?? ''))
  );

  constructor() {
    super();
    this.currentUrl = this.router.url;
    this.updateHeaderContext();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl = (event as NavigationEnd).urlAfterRedirects;
      this.updateHeaderContext();
    });
  }

  onHeaderSearchInput(value: string) {
    const key = this.pageHeaderSearch()?.queryParamKey ?? 'q';
    if (key === 'q') this.headerQuery = value;
    this.router.navigate([], {
      queryParams: { [key]: value || null, page: 1, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderActionClick() {
    const primaryAction = this.pageHeaderSearch()?.primaryAction;
    if (primaryAction) {
      this.runPageHeaderSearchAction(primaryAction);
      return;
    }

    if (this.headerActionKind === 'lesson-new') {
      this.router.navigate(['/arabic/lessons', this.lessonHeaderTarget, 'new']);
      return;
    }
    if (this.headerActionKind === 'roots-new') {
      this.router.navigate(['/arabic/roots'], {
        queryParams: { new: Date.now() },
        queryParamsHandling: 'merge',
      });
      return;
    }
    if (this.headerActionKind === 'worldview-new') {
      this.router.navigate(['/worldview/lessons/new'], { queryParams: { mode: 'capture' } });
    }
  }

  onHeaderSecondaryClick() {
    const secondaryAction = this.pageHeaderSearch()?.secondaryAction;
    if (secondaryAction) {
      this.runPageHeaderSearchAction(secondaryAction);
      return;
    }

    if (this.headerSecondaryKind === 'refresh') {
      this.triggerRefresh();
    }
  }

  onHeaderTertiaryClick() {
    const tertiaryAction = this.pageHeaderSearch()?.tertiaryAction;
    if (!tertiaryAction) return;
    this.runPageHeaderSearchAction(tertiaryAction);
  }

  resolvedHeaderPlaceholder() {
    return this.pageHeaderSearch()?.placeholder ?? this.headerPlaceholder;
  }

  resolvedHeaderValue() {
    const key = this.pageHeaderSearch()?.queryParamKey ?? 'q';
    const url = this.router.parseUrl(this.currentUrl);
    return String(url.queryParams[key] ?? '');
  }

  resolvedPrimaryLabel() {
    return this.pageHeaderSearch()?.primaryAction?.label ?? this.headerActionLabel;
  }

  resolvedSecondaryLabel() {
    return this.pageHeaderSearch()?.secondaryAction?.label ?? this.headerSecondaryLabel;
  }

  resolvedTertiaryLabel() {
    return this.pageHeaderSearch()?.tertiaryAction?.label ?? '';
  }

  resolvedHeaderFilters() {
    return this.pageHeaderSearch()?.filters ?? [];
  }

  onHeaderPageChange(page: number) {
    this.router.navigate([], {
      queryParams: { page, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderPageSizeChange(pageSize: number) {
    this.router.navigate([], {
      queryParams: { pageSize, page: 1, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderFilterChange(event: PageHeaderFilterChangeEvent) {
    const queryParams: Record<string, string | number | null> = {
      [event.queryParamKey]: event.value || null,
      offset: null,
    };
    if (event.resetPageOnChange !== false) {
      queryParams['page'] = 1;
    }
    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  toggleDiscourseFilter(key: string) {
    if (this.activeDiscourseFilters.has(key)) {
      this.activeDiscourseFilters.delete(key);
    } else {
      this.activeDiscourseFilters.add(key);
    }
    const categories = Array.from(this.activeDiscourseFilters.values());
    this.router.navigate([], {
      queryParams: { categories: categories.length ? categories.join(',') : null },
      queryParamsHandling: 'merge',
    });
  }

  discourseFilterActive(key: string) {
    return this.activeDiscourseFilters.has(key);
  }

  private updateHeaderContext() {
    const url = this.router.parseUrl(this.currentUrl);
    const segments = url.root.children['primary']?.segments ?? [];
    const path = segments.map((s) => s.path).join('/') ?? '';
    this.currentPath = `/${path}`;
    this.showHeaderTitle = segments.length > 1;
    this.headerTitle = this.resolveActiveTitle(this.router.routerState.snapshot.root) || 'k-maps';
    this.headerQuery = String(url.queryParams['q'] ?? '');

    this.showHeaderSearch = false;
    this.headerPlaceholder = 'Search';
    this.headerActionLabel = '';
    this.headerActionKind = '';
    this.headerSecondaryLabel = '';
    this.headerSecondaryKind = '';
    this.showDiscourseFilters = false;

    if (this.currentPath === '/arabic/lessons') {
      this.showHeaderSearch = true;
      this.headerPlaceholder = 'Search title or source';
      this.headerActionLabel = 'New';
      this.headerActionKind = 'lesson-new';
      this.headerSecondaryLabel = 'Refresh';
      this.headerSecondaryKind = 'refresh';
      const typeParam = String(url.queryParams['lesson_type'] ?? '').toLowerCase();
      this.lessonHeaderTarget = typeParam === 'other' ? 'literature' : 'quran';
      return;
    }

    if (this.currentPath === '/worldview/lessons') {
      this.showHeaderSearch = true;
      this.headerPlaceholder = 'Search title, creator, or summary';
      this.headerActionLabel = 'Log Source';
      this.headerActionKind = 'worldview-new';
      return;
    }

    if (this.currentPath.startsWith('/arabic/lessons/') && this.currentPath !== '/arabic/lessons') {
      return;
    }

    if (this.currentPath === '/arabic/roots') {
      this.showHeaderSearch = true;
      this.headerPlaceholder = 'Search root';
      this.headerActionLabel = 'Add';
      this.headerActionKind = 'roots-new';
      this.headerSecondaryLabel = 'Refresh';
      this.headerSecondaryKind = 'refresh';
      return;
    }

    if (this.currentPath === '/discourse/wv_concepts') {
      this.showHeaderSearch = true;
      this.headerPlaceholder = 'Search wv_concepts';
      this.showDiscourseFilters = true;
      const categoriesParam = String(url.queryParams['categories'] ?? '').trim();
      this.activeDiscourseFilters = new Set(
        categoriesParam ? categoriesParam.split(',').map((c) => c.trim()).filter(Boolean) : []
      );
      return;
    }

    if (this.currentPath === '/docs' || this.currentPath.startsWith('/docs/')) {
      this.showHeaderSearch = true;
      this.headerPlaceholder = 'Search docs, tags, or keywords';
    }
  }

  private resolveActiveTitle(snapshot: ActivatedRouteSnapshot | null): string {
    if (!snapshot) return '';
    if (snapshot.firstChild) {
      const childTitle = this.resolveActiveTitle(snapshot.firstChild);
      if (childTitle) return childTitle;
    }
    const title = snapshot.data?.['title'];
    return typeof title === 'string' ? title : '';
  }

  private triggerRefresh() {
    this.router.navigate([], {
      queryParams: { refresh: Date.now() },
      queryParamsHandling: 'merge',
    });
  }

  private runPageHeaderSearchAction(action: PageHeaderSearchAction) {
    if (action.commands?.length) {
      if (action.queryParams) {
        this.router.navigate(action.commands, { queryParams: action.queryParams });
        return;
      }
      this.router.navigate(action.commands);
      return;
    }

    if (!action.queryParams) return;
    this.router.navigate([], {
      queryParams: action.queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
