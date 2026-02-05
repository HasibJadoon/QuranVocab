import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokensService } from '../../../shared/services/tokens.service';
import { PageHeaderSearchService } from '../../../shared/services/page-header-search.service';
import { PageHeaderPaginationService } from '../../../shared/services/page-header-pagination.service';
import { TokenRow } from '../../../shared/models/arabic/token.model';
import { AppCrudTableComponent, CrudTableColumn } from '../../../shared/components';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, AppCrudTableComponent],
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
})
export class TokensComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly pageHeaderSearch = inject(PageHeaderSearchService);
  private readonly pageHeaderPagination = inject(PageHeaderPaginationService);
  private readonly subs = new Subscription();

  readonly posOptions = ['verb', 'noun', 'adj', 'particle', 'phrase'];

  q = '';
  pos = '';
  page = 1;
  pageSize = 50;
  pageSizeOptions = [25, 50, 100];
  tableColumns: CrudTableColumn[] = [
    {
      key: 'lemma_ar',
      label: 'Lemma (Arabic)',
      cellClass: () => 'app-table-arabic',
    },
    {
      key: 'lemma_norm',
      label: 'Lemma (Norm)',
      cellClass: () => 'app-table-english',
    },
    {
      key: 'pos',
      label: 'POS',
      cellClass: () => 'app-table-english',
    },
    {
      key: 'root',
      label: 'Root',
      value: (row) => this.displayRoot(row as TokenRow),
      cellClass: (row) => {
        const hasArabic = !!String(row['root'] ?? '').trim();
        return hasArabic ? 'app-table-arabic' : 'app-table-english';
      },
    },
    {
      key: 'canonical_input',
      label: 'Canonical',
      cellClass: () => 'app-table-english',
    },
    {
      key: 'meta',
      label: 'Meta',
      type: 'json',
      value: (row) => this.metaPayload(row as TokenRow),
      jsonTitle: 'Token metadata',
    },
  ];

  tokens: TokenRow[] = [];
  total = 0;
  loading = false;
  error = '';

  constructor(private tokensService: TokensService) {}

  ngOnInit() {
    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        this.q = params.get('q') ?? '';
        this.pos = params.get('pos') ?? '';
        this.page = this.parseIntParam(params.get('page'), 1, 1);
        this.pageSize = this.parseIntParam(params.get('pageSize'), 50, 25, 200);
        this.syncHeaderConfig();
        this.load();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageHeaderSearch.clearConfig();
    this.pageHeaderPagination.clearConfig();
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      const response = await this.tokensService.list({
        q: this.q.trim() || undefined,
        pos: this.pos || undefined,
        page: this.page,
        pageSize: this.pageSize,
      });
      this.tokens = response.results;
      this.total = response.total;
      this.page = this.parseIntParam(String(response.page ?? this.page), this.page, 1);
      this.pageSize = this.parseIntParam(String(response.pageSize ?? this.pageSize), this.pageSize, 25, 200);
      this.pageHeaderPagination.setConfig({
        page: this.page,
        pageSize: this.pageSize,
        total: this.total,
        hideIfSinglePage: true,
        pageSizeOptions: this.pageSizeOptions,
      });
    } catch (err: any) {
      console.error('tokens load failed', err);
      this.error = err?.message ?? 'Unable to fetch tokens.';
      this.pageHeaderPagination.clearConfig();
    } finally {
      this.loading = false;
    }
  }

  trackByToken(_index: number, token: TokenRow) {
    return token.id;
  }

  displayRoot(token: TokenRow) {
    if (!token.root && !token.root_norm) return '—';
    if (token.root && !token.root_norm) return token.root;
    if (token.root && token.root_norm) return `${token.root} (${token.root_norm})`;
    return token.root_norm;
  }

  metaPayload(token: TokenRow) {
    return {
      token_meta: token.meta ?? {},
      root_meta: token.root_meta ?? {},
    };
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

  private syncHeaderConfig() {
    this.pageHeaderSearch.setConfig({
      placeholder: 'Search lemma, root, or canonical input',
      queryParamKey: 'q',
      filters: [
        {
          id: 'pos',
          queryParamKey: 'pos',
          value: this.pos,
          options: [
            { value: '', label: 'All POS' },
            ...this.posOptions.map((option) => ({
              value: option,
              label: option.charAt(0).toUpperCase() + option.slice(1),
            })),
          ],
          resetPageOnChange: true,
        },
      ],
    });
  }
}
