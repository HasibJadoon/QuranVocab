import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { HeaderSearchComponent } from '../header-search/header-search.component';
import {
  PageHeaderFilterChangeEvent,
  PageHeaderFilterConfig,
} from '../../../../models/core/page-header.model';

export interface AppHeaderbarPagination {
  page: number;
  pageSize: number;
  total: number;
  hideIfSinglePage?: boolean;
  pageSizeOptions?: number[];
}

@Component({
  selector: 'app-headerbar',
  standalone: true,
  imports: [CommonModule, HeaderSearchComponent],
  templateUrl: './app-headerbar.component.html',
  styleUrls: ['./app-headerbar.component.scss'],
})
export class AppHeaderbarComponent {
  @Input() title = '';
  @Input() showTitle = false;
  @Input() showSearch = true;
  @Input() placeholder = 'Search';
  @Input() value = '';
  @Input() primaryLabel = '';
  @Input() secondaryLabel = '';
  @Input() tertiaryLabel = '';
  @Input() pagination: AppHeaderbarPagination | null = null;
  @Input() filters: PageHeaderFilterConfig[] = [];

  @Output() search = new EventEmitter<string>();
  @Output() primary = new EventEmitter<void>();
  @Output() secondary = new EventEmitter<void>();
  @Output() tertiary = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<PageHeaderFilterChangeEvent>();

  get totalPages() {
    const pageSize = this.pagination?.pageSize ?? 0;
    const total = this.pagination?.total ?? 0;
    if (!pageSize || !total) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }

  get shouldShowPagination() {
    if (!this.pagination) return false;
    const hasPageSizeSelector = !!this.pagination.pageSizeOptions?.length;
    if (hasPageSizeSelector) return true;
    if (this.pagination.hideIfSinglePage && this.totalPages <= 1) return false;
    return this.totalPages > 1;
  }

  onFilterInput(filter: PageHeaderFilterConfig, event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = String(target?.value ?? '');
    this.filterChange.emit({
      id: filter.id,
      queryParamKey: filter.queryParamKey,
      value,
      resetPageOnChange: filter.resetPageOnChange ?? true,
    });
  }

  onPageSizeInput(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = Number.parseInt(String(target?.value ?? ''), 10);
    if (!Number.isFinite(value) || value <= 0) return;
    this.pageSizeChange.emit(value);
  }

  onPrevPage() {
    if (!this.pagination) return;
    if (this.pagination.page <= 1) return;
    this.pageChange.emit(this.pagination.page - 1);
  }

  onNextPage() {
    if (!this.pagination) return;
    if (this.pagination.page >= this.totalPages) return;
    this.pageChange.emit(this.pagination.page + 1);
  }
}
