import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import type { BookScrollReaderChunk, BookScrollReaderPage } from '../../../../shared/models/arabic/book-search.model';
import { BookSearchService } from '../../../../shared/services/book-search.service';
import { BookScrollReaderService } from '../../../../shared/services/book-scroll-reader.service';

type ReaderJumpMode = 'around' | 'from-page';

@Component({
  selector: 'app-book-scroll-reader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-scroll-reader.component.html',
  styleUrls: ['./book-scroll-reader.component.scss'],
})
export class BookScrollReaderComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() sourceCode = '';
  @Input() query = '';
  @Input() indexTerm = '';
  @Input() indexTerms: string[] = [];
  @Input() fontSize = 17;
  @Input() arabicFriendlyLineHeight = true;
  @Input() monospace = false;
  @Input() wrapText = true;
  @Output() pageInViewChange = new EventEmitter<number | null>();

  @ViewChild('scrollViewport') scrollViewport?: ElementRef<HTMLDivElement>;
  @ViewChild('loadMoreSentinel') loadMoreSentinel?: ElementRef<HTMLDivElement>;

  pages: BookScrollReaderPage[] = [];
  loadingInitial = false;
  loadingMore = false;
  error = '';
  hasMore = false;
  nextStart: number | null = null;
  editingChunkId = '';
  editPageNo: number | null = null;
  editHeadingRaw = '';
  editText = '';
  editSaving = false;
  editError = '';
  editMessage = '';
  private copyMessageTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly pageSet = new Set<number>();
  private readonly loadLimit = 10;
  private sourceBootstrapped = '';
  private loadMoreObserver: IntersectionObserver | null = null;
  private lastRequestedStart: number | null = null;
  private pageInView: number | null = null;
  private pageInViewRaf: number | null = null;

  constructor(
    private readonly readerService: BookScrollReaderService,
    private readonly bookSearch: BookSearchService,
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

  ngOnDestroy(): void {
    this.clearCopyMessageTimer();
    this.teardownLoadMoreObserver();
    this.clearPageInViewRaf();
  }

  ngAfterViewInit(): void {
    this.setupLoadMoreObserver();
  }

  async jumpToPage(pageNo: number, sourceOverride?: string, mode: ReaderJumpMode = 'around'): Promise<void> {
    const source = String(sourceOverride ?? this.sourceCode ?? '').trim();
    const targetPage = Math.max(1, Math.trunc(Number(pageNo)));
    if (!source || !Number.isFinite(targetPage)) return;

    if (mode === 'around' && this.pageSet.has(targetPage)) {
      this.scrollToPageAnchor(targetPage, true);
      this.emitPageInView(targetPage);
      return;
    }

    this.loadingInitial = true;
    this.error = '';
    try {
      const start = mode === 'from-page' ? targetPage : Math.max(1, targetPage - 2);
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
      this.lastRequestedStart = null;
      this.scrollToTop();
      this.scrollToPageAnchor(targetPage, true);
      this.emitPageInView(targetPage);
      this.refreshLoadMoreObserver();
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Unable to jump to page.';
    } finally {
      this.loadingInitial = false;
    }
  }

  onViewportScroll(): void {
    this.schedulePageInViewCheck();
    if (!this.isNearBottom()) return;
    void this.maybeLoadMore();
  }

  chunkTextHtml(raw: string): SafeHtml {
    const text = this.normalizeChunkText(String(raw ?? ''));
    const terms = this.collectHighlightTerms();
    const highlighted = this.highlightText(text, terms);
    const paragraphs = highlighted
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => `<p>${part.replace(/\n/g, ' ')}</p>`)
      .join('');
    const html = paragraphs || '<p></p>';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private collectHighlightTerms(): string[] {
    const terms = [...this.searchTermsFromQuery(this.query)];
    for (const term of this.indexTerms ?? []) {
      terms.push(String(term ?? '').trim());
    }
    const indexTerm = String(this.indexTerm ?? '').trim();
    if (indexTerm) {
      terms.push(indexTerm);
    }
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const term of terms) {
      const normalized = String(term ?? '').trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(normalized);
    }
    unique.sort((a, b) => b.length - a.length);
    return unique;
  }

  chunkTextStyle(): Record<string, string> {
    return {
      'font-size.px': String(this.fontSize),
      'line-height': this.arabicFriendlyLineHeight ? '1.95' : '1.45',
      'font-family': this.monospace
        ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        : 'var(--arabic-font)',
      'white-space': this.wrapText ? 'normal' : 'pre',
      'text-align': 'justify',
      'text-align-last': 'start',
      'text-justify': 'inter-word',
    };
  }

  trackByPageNo = (_: number, page: BookScrollReaderPage) => page.page_no;
  trackByChunkId = (_: number, chunk: BookScrollReaderChunk) => chunk.chunk_id;

  isEditing(chunk: BookScrollReaderChunk): boolean {
    return this.editingChunkId === chunk.chunk_id;
  }

  startEdit(chunk: BookScrollReaderChunk, page: BookScrollReaderPage): void {
    this.editingChunkId = chunk.chunk_id;
    this.editPageNo = page.page_no;
    this.editHeadingRaw = chunk.heading_raw ?? '';
    this.editText = chunk.text_raw ?? '';
    this.editSaving = false;
    this.editError = '';
    this.editMessage = '';
  }

  cancelEdit(): void {
    this.editingChunkId = '';
    this.editPageNo = null;
    this.editHeadingRaw = '';
    this.editText = '';
    this.editSaving = false;
    this.editError = '';
  }

  async saveEdit(chunk: BookScrollReaderChunk, page: BookScrollReaderPage): Promise<void> {
    if (!this.isEditing(chunk) || this.editSaving) return;
    this.editSaving = true;
    this.editError = '';
    this.editMessage = '';
    try {
      const payload = {
        chunk_id: chunk.chunk_id,
        page_no: this.editPageNo,
        heading_raw: this.editHeadingRaw.trim() || null,
        text: this.editText,
      };
      const res = await firstValueFrom(this.bookSearch.updateChunk(payload));
      const savedChunk = res.chunk;
      if (savedChunk?.chunk_id === chunk.chunk_id) {
        chunk.heading_raw = savedChunk.heading_raw ?? null;
        chunk.text_raw = savedChunk.text ?? this.editText;
      } else {
        chunk.heading_raw = this.editHeadingRaw.trim() || null;
        chunk.text_raw = this.editText;
      }
      this.editMessage = 'Saved.';
      this.cancelEdit();

      if (savedChunk?.page_no !== null && savedChunk?.page_no !== undefined && savedChunk.page_no !== page.page_no) {
        await this.jumpToPage(savedChunk.page_no, this.sourceCode);
      }
    } catch (err: unknown) {
      this.editError = err instanceof Error ? err.message : 'Save failed.';
    } finally {
      this.editSaving = false;
    }
  }

  async copyChunkText(chunk: BookScrollReaderChunk): Promise<void> {
    const raw = this.isEditing(chunk) ? this.editText : chunk.text_raw ?? '';
    const text = String(raw ?? '');
    if (!text.trim()) {
      this.editError = 'Nothing to copy.';
      return;
    }

    try {
      await this.writeTextToClipboard(text);
      this.editError = '';
      this.editMessage = 'Copied.';
      this.resetCopyMessageTimer();
    } catch {
      this.editError = 'Clipboard copy failed.';
    }
  }

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
      this.lastRequestedStart = null;
      this.scrollToTop();
      this.schedulePageInViewCheck();
      this.refreshLoadMoreObserver();
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
    const start = this.nextStart;

    this.loadingMore = true;
    this.error = '';
    this.lastRequestedStart = start;
    try {
      const beforeCount = this.pages.length;
      const res = await firstValueFrom(
        this.readerService.listPagesByRange({
          source_id: source,
          start,
          limit: this.loadLimit,
        })
      );
      this.appendPages(res.pages ?? []);
      const afterCount = this.pages.length;
      const next = res.next_start ?? null;
      const progressed = next === null || next > start;
      const appended = afterCount > beforeCount;

      if (!appended && !progressed) {
        this.hasMore = false;
        this.nextStart = null;
      } else {
        this.hasMore = !!res.has_more && progressed;
        this.nextStart = this.hasMore ? next : null;
      }
      this.refreshLoadMoreObserver();
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Unable to load more pages.';
      // Pause auto-load on failure to avoid hammering the same range request in a loop.
      this.hasMore = false;
      this.nextStart = null;
      this.lastRequestedStart = start;
    } finally {
      this.loadingMore = false;
    }
  }

  private async maybeLoadMore(): Promise<void> {
    if (this.loadingInitial || this.loadingMore || !this.hasMore || this.nextStart === null) return;
    if (this.lastRequestedStart !== null && this.lastRequestedStart === this.nextStart) return;
    await this.loadMoreRange();
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
      this.schedulePageInViewCheck();
    }, 0);
  }

  private scrollToPageAnchor(pageNo: number, smooth: boolean): void {
    setTimeout(() => {
      const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
      document.getElementById(`page-${pageNo}`)?.scrollIntoView({ behavior, block: 'start' });
      this.schedulePageInViewCheck();
    }, 0);
  }

  private isNearBottom(): boolean {
    const viewport = this.scrollViewport?.nativeElement;
    if (!viewport) return false;
    return viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 300;
  }

  private resetState(): void {
    this.pages = [];
    this.pageSet.clear();
    this.loadingInitial = false;
    this.loadingMore = false;
    this.error = '';
    this.hasMore = false;
    this.nextStart = null;
    this.lastRequestedStart = null;
    this.sourceBootstrapped = '';
    this.cancelEdit();
    this.clearCopyMessageTimer();
    this.emitPageInView(null);
    this.clearPageInViewRaf();
  }

  private schedulePageInViewCheck(): void {
    if (typeof window === 'undefined') return;
    if (this.pageInViewRaf !== null) return;
    this.pageInViewRaf = window.requestAnimationFrame(() => {
      this.pageInViewRaf = null;
      this.updatePageInViewFromViewport();
    });
  }

  private clearPageInViewRaf(): void {
    if (this.pageInViewRaf === null || typeof window === 'undefined') return;
    window.cancelAnimationFrame(this.pageInViewRaf);
    this.pageInViewRaf = null;
  }

  private updatePageInViewFromViewport(): void {
    const nextPage = this.probePageInView();
    this.emitPageInView(nextPage);
  }

  private probePageInView(): number | null {
    const viewport = this.scrollViewport?.nativeElement;
    if (!viewport || !this.pages.length) return null;

    if (typeof document !== 'undefined') {
      const rect = viewport.getBoundingClientRect();
      const probeX = rect.left + Math.min(Math.max(24, rect.width * 0.12), rect.width - 24);
      const probeY = rect.top + Math.min(Math.max(28, rect.height * 0.24), rect.height - 24);
      const node = document.elementFromPoint(probeX, probeY) as HTMLElement | null;
      const pageSection = node?.closest('section.book-page[id^="page-"]') as HTMLElement | null;
      if (pageSection?.id?.startsWith('page-')) {
        const parsed = Number.parseInt(pageSection.id.slice(5), 10);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    // Fallback when the probe point is over non-content UI; pick the last page that started above the anchor.
    const anchor = viewport.scrollTop + Math.min(220, viewport.clientHeight * 0.3);
    let candidate: number | null = null;
    for (const page of this.pages) {
      const el = viewport.querySelector<HTMLElement>(`#page-${page.page_no}`);
      if (!el) continue;
      if (el.offsetTop <= anchor) {
        candidate = page.page_no;
        continue;
      }
      break;
    }
    return candidate ?? this.pages[0]?.page_no ?? null;
  }

  private emitPageInView(pageNo: number | null): void {
    const normalized = pageNo === null ? null : Math.max(1, Math.trunc(Number(pageNo)));
    if (this.pageInView === normalized) return;
    this.pageInView = normalized;
    this.pageInViewChange.emit(normalized);
  }

  private setupLoadMoreObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.teardownLoadMoreObserver();
    this.loadMoreObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (!visible) return;
        void this.maybeLoadMore();
      },
      {
        root: this.scrollViewport?.nativeElement ?? null,
        rootMargin: '0px 0px 260px 0px',
        threshold: 0,
      }
    );
    this.refreshLoadMoreObserver();
  }

  private refreshLoadMoreObserver(): void {
    if (!this.loadMoreObserver || !this.loadMoreSentinel?.nativeElement) return;
    this.loadMoreObserver.disconnect();
    this.loadMoreObserver.observe(this.loadMoreSentinel.nativeElement);
  }

  private teardownLoadMoreObserver(): void {
    if (!this.loadMoreObserver) return;
    this.loadMoreObserver.disconnect();
    this.loadMoreObserver = null;
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

  private normalizeChunkText(raw: string): string {
    if (!raw) return '';
    const normalized = raw.replace(/\r\n?/g, '\n');
    const dehyphenated = normalized.replace(/([A-Za-z\u0600-\u06FF])-\s*\n\s*([A-Za-z\u0600-\u06FF])/g, '$1$2');
    const paragraphs = dehyphenated
      .split(/\n{2,}/)
      .map((part) =>
        part
          .replace(/\s*\n\s*/g, ' ')
          .replace(/[ \t]{2,}/g, ' ')
          .trim()
      )
      .filter((part) => part.length > 0);
    return paragraphs.join('\n\n');
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

  private async writeTextToClipboard(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    if (typeof document === 'undefined') {
      throw new Error('Clipboard unavailable');
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (!copied) {
      throw new Error('Clipboard unavailable');
    }
  }

  private resetCopyMessageTimer(): void {
    this.clearCopyMessageTimer();
    this.copyMessageTimer = setTimeout(() => {
      if (this.editMessage === 'Copied.') {
        this.editMessage = '';
      }
      this.copyMessageTimer = null;
    }, 1500);
  }

  private clearCopyMessageTimer(): void {
    if (this.copyMessageTimer) {
      clearTimeout(this.copyMessageTimer);
      this.copyMessageTimer = null;
    }
  }
}
