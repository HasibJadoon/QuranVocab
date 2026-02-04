import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokensService } from '../../../shared/services/tokens.service';
import { PageHeaderSearchService } from '../../../shared/services/page-header-search.service';
import { TokenRow } from '../../../shared/models/arabic/token.model';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
})
export class TokensComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly pageHeaderSearch = inject(PageHeaderSearchService);
  private readonly subs = new Subscription();

  readonly posOptions = ['verb', 'noun', 'adj', 'particle', 'phrase'];

  q = '';
  pos = '';
  page = 1;
  pageSize = 50;
  pageSizeOptions = [25, 50, 100];

  tokens: TokenRow[] = [];
  total = 0;
  loading = false;
  error = '';

  constructor(private tokensService: TokensService) {}

  ngOnInit() {
    this.pageHeaderSearch.setConfig({
      placeholder: 'Search lemma, root, or canonical input',
      queryParamKey: 'q',
    });
    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        this.q = params.get('q') ?? '';
        this.page = 1;
        this.load();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageHeaderSearch.clearConfig();
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
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
    } catch (err: any) {
      console.error('tokens load failed', err);
      this.error = err?.message ?? 'Unable to fetch tokens.';
    } finally {
      this.loading = false;
    }
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.load();
  }

  changePage(direction: 'prev' | 'next') {
    if (direction === 'prev' && this.page > 1) {
      this.page -= 1;
      this.load();
    }
    if (direction === 'next' && this.page < this.totalPages) {
      this.page += 1;
      this.load();
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
}
