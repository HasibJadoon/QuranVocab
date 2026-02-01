import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokensService } from '../../../shared/services/tokens.service';
import { TokenRow } from '../../../shared/models/arabic/token.model';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
})
export class TokensComponent implements OnInit {
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
    this.load();
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

  onSearch() {
    this.page = 1;
    this.load();
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
