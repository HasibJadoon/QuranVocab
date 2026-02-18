import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import type { BookScrollReaderChunk, BookScrollReaderPage } from '../../../../shared/models/arabic/book-search.model';
import { BookScrollReaderService } from '../../../../shared/services/book-scroll-reader.service';

@Component({
  selector: 'app-book-scroll-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-scroll-reader.component.html',
  styleUrls: ['./book-scroll-reader.component.scss'],
})
export class BookScrollReaderComponent implements OnChanges {
  @Input() sourceCode = '';
  @Input() query = '';
  @Input() fontSize = 17;
  @Input() arabicFriendlyLineHeight = true;
  @Input() monospace = false;
  @Input() wrapText = true;

  @ViewChild('scrollViewport') scrollViewport?: ElementRef<HTMLDivElement>;

  pages: BookScrollReaderPage[] = [];
  loadingInitial = false;
  loadingMore = false;
  error = '';
  hasMore = false;
  nextStart: number | null = null;

  private readonly pageSet = new Set<number>();
  private readonly loadLimit = 10;
  private sourceBootstrapped = '';

  constructor(
    private readonly readerService: BookScrollReaderService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('sourceCode' in changes) {
      const source = String(this.sourceCode ?? '').trim();
      if (!source) {
        this.resetState();
        return;
      }
      if (source !== this.sourceBootstrapped) {
        this.sourceBootstrapped = source;
        void this.loadInitialRange();
      }
    }
  }

  async jumpToPage(pageNo: number): Promise<void> {
    const source = String(this.sourceCode ?? '').trim();
    const targetPage = Math.max(1, Math.trunc(Number(pageNo)));
    if (!source || !Number.isFinite(targetPage)) return;

    if (this.pageSet.has(targetPage)) {
      this.scrollToPageAnchor(targetPage, true);
      return;
    }

    this.loadingInitial = true;
    this.error = '';
    try {
      const start = Math.max(1, targetPage - 2);
      const res = await firstValueFrom(
        this.readerService.listPagesByRange({
          source_id: source,
          start,
          limit: this.loadLimit,
        })
      );
      this.replacePages(res.pages ?? []);
      this.hasMore = !!res.has_more;
      this.nextStart = res.next_start ?? null;
      this.scrollToTop();
      this.scrollToPageAnchor(targetPage, true);
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Unable to jump to page.';
    } finally {
      this.loadingInitial = false;
    }
  }

  onViewportScroll(): void {
    const viewport = this.scrollViewport?.nativeElement;
    if (!viewport || this.loadingMore || this.loadingInitial || !this.hasMore || this.nextStart === null) return;
    const nearBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 300;
    if (!nearBottom) return;
    void this.loadMoreRange();
  }

  chunkTextHtml(raw: string): SafeHtml {
    const text = String(raw ?? '');
    const terms = this.searchTermsFromQuery(this.query);
    const highlighted = this.highlightText(text, terms).replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  chunkTextStyle(): Record<string, string> {
    return {
      'font-size.px': String(this.fontSize),
      'line-height': this.arabicFriendlyLineHeight ? '1.95' : '1.45',
      'font-family': this.monospace
        ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        : 'var(--arabic-font)',
      'white-space': this.wrapText ? 'pre-wrap' : 'pre',
      'text-align': 'justify',
      'text-align-last': 'start',
      'text-justify': 'inter-word',
    };
  }

  trackByPageNo = (_: number, page: BookScrollReaderPage) => page.page_no;
  trackByChunkId = (_: number, chunk: BookScrollReaderChunk) => chunk.chunk_id;

  private async loadInitialRange(): Promise<void> {
    const source = String(this.sourceCode ?? '').trim();
    if (!source) {
      this.resetState();
      return;
    }

    this.loadingInitial = true;
    this.error = '';
    try {
      const res = await firstValueFrom(
        this.readerService.listPagesByRange({
          source_id: source,
          start: 1,
          limit: this.loadLimit,
        })
      );
      this.replacePages(res.pages ?? []);
      this.hasMore = !!res.has_more;
      this.nextStart = res.next_start ?? null;
      this.scrollToTop();
    } catch (err: unknown) {
      this.resetState();
      this.error = err instanceof Error ? err.message : 'Unable to load book pages.';
    } finally {
      this.loadingInitial = false;
    }
  }

  private async loadMoreRange(): Promise<void> {
    const source = String(this.sourceCode ?? '').trim();
    if (!source || this.nextStart === null) return;

    this.loadingMore = true;
    this.error = '';
    try {
      const res = await firstValueFrom(
        this.readerService.listPagesByRange({
          source_id: source,
          start: this.nextStart,
          limit: this.loadLimit,
        })
      );
      this.appendPages(res.pages ?? []);
      this.hasMore = !!res.has_more;
      this.nextStart = res.next_start ?? null;
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Unable to load more pages.';
    } finally {
      this.loadingMore = false;
    }
  }

  private replacePages(nextPages: BookScrollReaderPage[]): void {
    this.pages = [];
    this.pageSet.clear();
    this.appendPages(nextPages);
  }

  private appendPages(nextPages: BookScrollReaderPage[]): void {
    const incoming = [...nextPages]
      .map((page) => ({
        page_no: Number(page.page_no),
        pdf_page_index: page.pdf_page_index ?? null,
        chunks: [...(page.chunks ?? [])].sort((a, b) => {
          const orderDiff = Number(a.order_index ?? 0) - Number(b.order_index ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return String(a.chunk_id).localeCompare(String(b.chunk_id));
        }),
      }))
      .filter((page) => Number.isFinite(page.page_no));

    for (const page of incoming) {
      if (this.pageSet.has(page.page_no)) continue;
      this.pageSet.add(page.page_no);
      this.pages.push(page);
    }

    this.pages.sort((a, b) => a.page_no - b.page_no);
  }

  private scrollToTop(): void {
    setTimeout(() => {
      this.scrollViewport?.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
  }

  private scrollToPageAnchor(pageNo: number, smooth: boolean): void {
    setTimeout(() => {
      const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
      document.getElementById(`page-${pageNo}`)?.scrollIntoView({ behavior, block: 'start' });
    }, 0);
  }

  private resetState(): void {
    this.pages = [];
    this.pageSet.clear();
    this.loadingInitial = false;
    this.loadingMore = false;
    this.error = '';
    this.hasMore = false;
    this.nextStart = null;
    this.sourceBootstrapped = '';
  }

  private searchTermsFromQuery(query: string): string[] {
    const q = String(query ?? '').trim();
    if (!q) return [];

    const phrases: string[] = [];
    const phraseRegex = /"([^"]+)"|'([^']+)'/g;
    let match: RegExpExecArray | null;
    while ((match = phraseRegex.exec(q)) !== null) {
      const phrase = (match[1] ?? match[2] ?? '').trim();
      if (phrase) phrases.push(phrase);
    }

    const cleaned = q
      .replace(/"[^"]+"/g, ' ')
      .replace(/'[^']+'/g, ' ')
      .replace(/[()]/g, ' ');

    const tokens = cleaned
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .filter((token) => !/^(AND|OR|NOT)$/i.test(token))
      .map((token) => token.replace(/[*]+$/g, ''))
      .map((token) => token.replace(/^[^:\s]+:/, ''))
      .filter((token) => token.length > 0);

    const merged = [...phrases, ...tokens];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const token of merged) {
      const key = token.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(token);
    }
    unique.sort((a, b) => b.length - a.length);
    return unique;
  }

  private highlightText(raw: string, terms: string[]): string {
    if (!raw) return '';
    if (!terms.length) return this.escapeHtml(raw);

    const pattern = terms.map((term) => this.escapeRegex(term)).join('|');
    if (!pattern) return this.escapeHtml(raw);

    const regex = new RegExp(pattern, 'giu');
    let out = '';
    let cursor = 0;
    for (const match of raw.matchAll(regex)) {
      const hit = match[0];
      const start = match.index ?? 0;
      out += this.escapeHtml(raw.slice(cursor, start));
      out += `<mark>${this.escapeHtml(hit)}</mark>`;
      cursor = start + hit.length;
    }
    out += this.escapeHtml(raw.slice(cursor));
    return out;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
