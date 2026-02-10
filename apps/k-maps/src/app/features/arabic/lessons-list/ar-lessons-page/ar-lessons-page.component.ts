import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ArLessonsService } from '../../../../shared/services/ar-lessons.service';
import { ArLessonRow } from '../../../../shared/models/arabic/lesson-row.model';
import {
  PageHeaderFilterChangeEvent,
  PageHeaderFilterConfig,
} from '../../../../shared/models/core/page-header.model';
import {
  AppCrudTableComponent,
  AppHeaderbarComponent,
  AppHeaderbarPagination,
  CrudTableAction,
  CrudTableActionEvent,
  CrudTableColumn
} from '../../../../shared/components';

@Component({
  selector: 'app-ar-lessons-page',
  standalone: true,
  imports: [CommonModule, AppCrudTableComponent, AppHeaderbarComponent],
  templateUrl: './ar-lessons-page.component.html',
  styleUrls: ['./ar-lessons-page.component.scss']
})
export class ArLessonsPageComponent implements OnInit {
  readonly pageSizeOptions = [50, 100, 200];
  readonly lessonTypeOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'All lessons' },
    { value: 'quran', label: 'Quran lessons' },
    { value: 'literature', label: 'Literature lessons' },
  ];
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lessons = inject(ArLessonsService);

  q = '';
  page = 1;
  pageSize = 100;
  total = 0;
  rows: ArLessonRow[] = [];

  loading = false;
  error = '';
  headerTitle = 'Arabic Lessons';
  lessonTypeFilter: 'all' | 'quran' | 'literature' = 'quran';
  lockedLessonType: 'quran' | 'literature' | null = null;
  tableColumns: CrudTableColumn[] = [
    {
      key: 'title',
      label: 'Title',
      cellClass: (row: Record<string, unknown>) =>
        this.isArabicText(String(row['title'] ?? '')) ? 'app-table-arabic' : '',
    },
    { key: 'lesson_type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeClass: (row: Record<string, unknown>) =>
        this.statusBadgeClass(String(row['status'] ?? '')),
    },
  ];
  tableActions: CrudTableAction[] = [
    { id: 'view', label: 'View', icon: 'view', variant: 'primary', outline: true },
    { id: 'study', label: 'Study', icon: 'study', variant: 'secondary', outline: true },
    { id: 'edit', label: 'Edit', icon: 'edit', variant: 'primary', outline: false },
  ];

  ngOnInit() {
    this.route.data.subscribe((data) => {
      const locked = String(data?.['lessonType'] ?? '').toLowerCase();
      this.lockedLessonType = locked === 'literature' ? 'literature' : locked === 'quran' ? 'quran' : null;
      this.headerTitle = String(data?.['title'] ?? 'Arabic Lessons');
    });

    this.route.queryParamMap.subscribe((params) => {
      this.q = params.get('q') ?? '';
      const typeParam = params.get('lesson_type');
      const incoming =
        typeParam === 'literature'
          ? 'literature'
          : typeParam === 'quran'
            ? 'quran'
            : typeParam === 'all'
              ? 'all'
              : 'quran';
      this.lessonTypeFilter = this.lockedLessonType ?? incoming;
      this.page = this.parseIntParam(params.get('page'), 1, 1);
      this.pageSize = this.parseIntParam(params.get('pageSize'), 100, 1, 200);
      this.load();
    });
  }

  get headerFilters(): PageHeaderFilterConfig[] {
    if (this.lockedLessonType) return [];
    return [
      {
        id: 'lesson_type',
        queryParamKey: 'lesson_type',
        value: this.lessonTypeFilter === 'all' ? '' : this.lessonTypeFilter,
        options: this.lessonTypeOptions,
        resetPageOnChange: true,
      },
    ];
  }

  get headerPagination(): AppHeaderbarPagination {
    return {
      page: this.page,
      pageSize: this.pageSize,
      total: this.total,
      hideIfSinglePage: true,
      pageSizeOptions: this.pageSizeOptions,
    };
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      const params: Record<string, string> = {
        page: String(this.page),
        pageSize: String(this.pageSize),
      };
      if (this.q) params['q'] = this.q;
      if (this.lessonTypeFilter === 'quran') {
        params['lesson_type'] = 'quran';
      } else if (this.lessonTypeFilter === 'literature') {
        params['lesson_type'] = 'literature';
      }
      const data = (await this.lessons.list(params)) as {
        results?: ArLessonRow[];
        total?: number;
        page?: number;
        pageSize?: number;
      };
      this.rows = Array.isArray(data?.results) ? data.results : [];
      this.total = Number(data?.total ?? this.rows.length);
      this.page = this.parseIntParam(String(data?.page ?? this.page), this.page, 1);
      this.pageSize = this.parseIntParam(String(data?.pageSize ?? this.pageSize), this.pageSize, 1, 200);
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to load lessons';
      this.rows = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onHeaderSearchInput(value: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null, page: 1, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderFilterChange(event: PageHeaderFilterChangeEvent) {
    if (event.id !== 'lesson_type') return;
    if (this.lockedLessonType) return;
    const type = event.value === 'quran' || event.value === 'literature' ? event.value : 'all';
    if (this.lessonTypeFilter === type) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lesson_type: type === 'all' ? null : type, page: 1, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderPageChange(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderPageSizeChange(pageSize: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageSize, page: 1, offset: null },
      queryParamsHandling: 'merge',
    });
  }

  onHeaderAddClick() {
    const target = this.lessonTypeFilter === 'literature' ? 'literature' : 'quran';
    this.router.navigate(['/arabic', target, 'lessons', 'new']);
  }

  refresh() {
    this.load();
  }

  view(id: number, type: string) {
    const prefix = this.getLessonPrefix(type);
    this.router.navigate(['/arabic', prefix, 'lessons', id, 'view']);
  }

  edit(row: { id: number; lesson_type: string }) {
    const prefix = this.getLessonPrefix(row.lesson_type);
    this.router.navigate(['/arabic', prefix, 'lessons', row.id, 'edit']);
  }

  study(row: { id: number; lesson_type: string }) {
    const prefix = this.getLessonPrefix(row.lesson_type);
    this.router.navigate(['/arabic', prefix, 'lessons', row.id, 'study']);
  }

  onViewRow(row: Record<string, unknown>) {
    const id = Number(row['id']);
    const lessonType = String(row['lesson_type'] ?? '');
    if (!Number.isFinite(id)) return;
    this.view(id, lessonType);
  }

  onEditRow(row: Record<string, unknown>) {
    const id = Number(row['id']);
    const lessonType = String(row['lesson_type'] ?? '');
    if (!Number.isFinite(id)) return;
    this.edit({ id, lesson_type: lessonType });
  }

  onStudyRow(row: Record<string, unknown>) {
    const id = Number(row['id']);
    const lessonType = String(row['lesson_type'] ?? '');
    if (!Number.isFinite(id)) return;
    this.study({ id, lesson_type: lessonType });
  }

  onTableAction(event: CrudTableActionEvent) {
    const row = event.row as Record<string, unknown>;
    if (event.id === 'view') {
      this.onViewRow(row);
      return;
    }
    if (event.id === 'study') {
      this.onStudyRow(row);
      return;
    }
    if (event.id === 'edit') {
      this.onEditRow(row);
    }
  }

  private getLessonPrefix(type?: string): 'quran' | 'literature' {
    const normalized = (type ?? '').toLowerCase();
    return normalized === 'quran' ? 'quran' : 'literature';
  }

  statusBadgeClass(status: string) {
    const normalized = (status ?? '').toLowerCase();
    switch (normalized) {
      case 'published':
      case 'live':
        return 'bg-success';
      case 'review':
      case 'in_review':
        return 'bg-warning text-dark';
      case 'draft':
        return 'bg-secondary';
      case 'archived':
      case 'old':
        return 'bg-dark';
      default:
        return 'bg-info text-dark';
    }
  }

  isArabicText(text: string) {
    return /[\u0600-\u06FF]/.test(text ?? '');
  }

  private parseIntParam(
    value: string | null,
    fallback: number,
    min: number,
    max?: number
  ) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed)) return fallback;
    const clampedMin = Math.max(min, parsed);
    if (typeof max !== 'number') return clampedMin;
    return Math.min(max, clampedMin);
  }
}
