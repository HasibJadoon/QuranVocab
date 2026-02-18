import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { BookSearchService } from '../../../../shared/services/book-search.service';
import { AppHeaderbarComponent, AppStickyPanelComponent } from '../../../../shared/components';
import { BookScrollReaderComponent } from './book-scroll-reader.component';
import type {
  BookSearchChunkHit,
  BookSearchIndexRow,
  BookSearchPageRow,
  BookSearchReaderChunk,
  BookSearchReaderNav,
  BookSearchSource,
  BookSearchTocRow,
} from '../../../../shared/models/arabic/book-search.model';
type ReadTab = 'pages' | 'index' | 'toc';
type MobileTab = 'books' | 'reader';
type ReaderJumpMode = 'around' | 'from-page';

type SearchRow = {
  chunk_id: string;
  page_no: number | null;
  heading_raw: string | null;
  snippet_html: SafeHtml;
};

type IndexRef = {
  from: number;
  to: number;
  note: string | null;
  is_main: boolean;
};

type TocMainIndexHit = {
  index_id: string;
  term: string;
  target_page: number | null;
  refs_label: string;
  row: BookSearchIndexRow;
};

@Component({
  selector: 'app-source-chunks-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderbarComponent, AppStickyPanelComponent, BookScrollReaderComponent],
  templateUrl: './source-chunks-page.component.html',
  styleUrls: ['./source-chunks-page.component.scss'],
})
export class SourceChunksPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('readerViewport') readerViewport?: ElementRef<HTMLDivElement>;
  @ViewChild('bookReader') bookReader?: BookScrollReaderComponent;
  @ViewChild('tocCatalog') tocCatalog?: ElementRef<HTMLElement>;

  books: BookSearchSource[] = [];
  booksLoading = false;
  booksError = '';

  selectedSourceCode = '';
  readTab: ReadTab = 'toc';
  bookPickerOpen = false;

  pageFrom: number | null = null;
  pageTo: number | null = null;
  headingFilter = '';
  jumpPageNo: number | null = null;
  selectedTermChunkId = '';
  termRows: BookSearchIndexRow[] = [];
  termsLoading = false;
  termsError = '';

  query = '';

  searchLoading = false;
  searchError = '';
  searchTotal = 0;
  searchRows: SearchRow[] = [];

  readLoading = false;
  readError = '';
  readTotal = 0;
  readRows: BookSearchPageRow[] = [];
  indexRows: BookSearchIndexRow[] = [];
  tocRows: BookSearchTocRow[] = [];
  allTocRows: BookSearchTocRow[] = [];
  allIndexRows: BookSearchIndexRow[] = [];
  tocMainIndexHits: TocMainIndexHit[] = [];
  pageIndexHits: TocMainIndexHit[] = [];
  indexLoading = false;
  indexError = '';
  activeReaderPageNo: number | null = null;
  activeTocRangeStart: number | null = null;
  activeTocRangeEnd: number | null = null;

  selectedChunk: BookSearchReaderChunk | null = null;
  activeChunkId = '';
  activeTocId = '';
  activeIndexId = '';
  activeIndexTerm = '';
  readerLoading = false;
  readerError = '';
  readerNav: BookSearchReaderNav = {
    prev_chunk_id: null,
    prev_page_no: null,
    next_chunk_id: null,
    next_page_no: null,
    prev_toc_id: null,
    next_toc_id: null,
  };

  readonly chunkTypeOptions = ['grammar', 'literature', 'lexicon', 'reference', 'other'] as const;
  editorEditing = false;
  editorSaving = false;
  editorError = '';
  editorMessage = '';
  editPageNo: number | null = null;
  editHeadingRaw = '';
  editLocator = '';
  editChunkType = 'lexicon';
  editText = '';

  fontSize = 17;
  arabicFriendlyLineHeight = true;
  monospace = false;
  wrapText = true;

  isCompact = false;
  mobileTab: MobileTab = 'books';
  showIndexesPanel = true;
  navigatorWidth = 380;
  readonly minNavigatorWidth = 300;
  readonly maxNavigatorWidth = 560;

  private readonly onResize = () => this.updateResponsiveState();
  private initialChunkId = '';
  private initialTocId = '';
  private pendingJumpPage: number | null = null;
  private pendingJumpSource = '';
  private pendingJumpMode: ReaderJumpMode = 'around';
  private autoAdvanceInFlight = false;
  private autoAdvanceLastKey = '';
  private autoAdvanceLastAt = 0;
  private readonly refsByIndexId = new Map<string, IndexRef[]>();
  private readonly pageIndexHitsCache = new Map<number, TocMainIndexHit[]>();
  private readonly tocRangeMainIndexCache = new Map<string, TocMainIndexHit[]>();
  private readonly filteredTocCache = new Map<string, { rows: BookSearchTocRow[]; total: number }>();
  private readonly allTocCache = new Map<string, BookSearchTocRow[]>();
  private readonly allIndexCache = new Map<string, BookSearchIndexRow[]>();
  private readonly searchCache = new Map<string, { rows: SearchRow[]; total: number }>();
  private readRequestSeq = 0;
  private searchRequestSeq = 0;

  constructor(
    private readonly bookSearch: BookSearchService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.applyQueryParams();
    this.updateResponsiveState();
    window.addEventListener('resize', this.onResize);
    void this.loadBooksAndBootstrap();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }

  ngAfterViewInit(): void {
    if (this.pendingJumpPage === null || !this.pendingJumpSource) return;
    const pageNo = this.pendingJumpPage;
    const source = this.pendingJumpSource;
    const mode = this.pendingJumpMode;
    this.pendingJumpPage = null;
    this.pendingJumpSource = '';
    this.pendingJumpMode = 'around';
    void this.bookReader?.jumpToPage(pageNo, source, mode);
  }

  get scopeLabel(): string {
    if (!this.selectedSourceCode) return 'Select a book';
    const source = this.books.find((b) => b.source_code === this.selectedSourceCode);
    return source ? `${source.source_code} — ${source.title}` : this.selectedSourceCode;
  }

  get currentTotal(): number {
    return this.readTotal;
  }

  get tableCountLabel(): string {
    return `${this.currentTotal} TOC entries`;
  }

  get listEmptyMessage(): string {
    return 'No TOC entries imported for this book';
  }

  get readerEmptyMessage(): string {
    return 'Select a TOC row to read';
  }

  get tocMainIndexRangeLabel(): string {
    if (this.activeTocRangeStart === null) return 'current section';
    if (this.activeTocRangeEnd === null || this.activeTocRangeEnd === this.activeTocRangeStart) {
      return `page ${this.activeTocRangeStart}`;
    }
    return `pages ${this.activeTocRangeStart}-${this.activeTocRangeEnd}`;
  }

  get currentPageIndexLabel(): string {
    if (this.activeReaderPageNo === null) return 'current page';
    return `page ${this.activeReaderPageNo}`;
  }

  get readerIndexTerms(): string[] {
    if (!this.pageIndexHits.length && !this.activeIndexTerm) return [];

    const seen = new Set<string>();
    const terms: string[] = [];
    const pushTerm = (value: unknown): void => {
      const term = String(value ?? '').trim();
      if (!term) return;
      const key = term.toLocaleLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      terms.push(term);
    };

    for (const hit of this.pageIndexHits) {
      pushTerm(hit.term);
      pushTerm(hit.row.term_raw);
      pushTerm(hit.row.term_norm);
      pushTerm(hit.row.term_ar);
      pushTerm(hit.row.term_ar_guess);
    }

    pushTerm(this.activeIndexTerm);
    terms.sort((a, b) => b.length - a.length);
    return terms;
  }

  get isTocReader(): boolean {
    return this.selectedChunk?.reader_scope === 'toc' || !!this.selectedChunk?.toc_id;
  }

  get selectedBookName(): string {
    if (!this.selectedSourceCode) return 'Select Book';
    const book = this.books.find((item) => item.source_code === this.selectedSourceCode);
    if (!book) return this.selectedSourceCode;
    return this.bookDisplayName(book);
  }

  get workspaceCssVars(): Record<string, string> {
    return {
      '--navigator-width': `${this.navigatorWidth}px`,
    };
  }

  panelActive(tab: MobileTab): boolean {
    return !this.isCompact || this.mobileTab === tab;
  }

  setMobileTab(tab: MobileTab): void {
    this.mobileTab = tab;
  }

  toggleIndexesPanel(): void {
    this.showIndexesPanel = !this.showIndexesPanel;
  }

  onHeaderSearchInput(value: string): void {
    this.query = value ?? '';
    if (!this.query.trim()) {
      this.searchRows = [];
      this.searchTotal = 0;
      this.searchError = '';
    }
    this.syncUrl();
  }

  clearSearch(): void {
    this.query = '';
    this.searchRows = [];
    this.searchTotal = 0;
    this.searchError = '';
    this.syncUrl();
  }

  onBookChange(): void {
    this.bookPickerOpen = false;
    this.clearReaderSelection();
    this.searchError = '';
    this.readError = '';
    this.jumpPageNo = null;
    void this.reloadBookData(true);
    this.syncUrl();
  }

  runSearch(): void {
    void this.loadSearchRows(true);
    this.syncUrl();
  }

  applyFilters(): void {
    void this.loadCurrentList(true);
    this.syncUrl();
  }

  clearFilters(): void {
    this.pageFrom = null;
    this.pageTo = null;
    this.headingFilter = '';
    void this.loadCurrentList(true);
    this.syncUrl();
  }

  openJumpPage(): void {
    const sourceCode = this.selectedSourceCode;
    const pageNo = this.jumpPageNo;
    if (!sourceCode || pageNo === null || !Number.isFinite(Number(pageNo))) return;
    void this.jumpReaderToPage(pageNo, true);
  }

  openSelectedTerm(): void {
    if (!this.selectedTermChunkId) return;
    const row = this.termRows.find((item) => item.index_id === this.selectedTermChunkId);
    if (!row) return;
    this.openIndexRow(row);
  }

  toggleBookPicker(): void {
    this.bookPickerOpen = !this.bookPickerOpen;
  }

  closeBookPicker(): void {
    this.bookPickerOpen = false;
  }

  onBookPickerSelect(sourceCode: string): void {
    if (!sourceCode) return;
    if (sourceCode === this.selectedSourceCode) {
      this.bookPickerOpen = false;
      return;
    }
    this.selectedSourceCode = sourceCode;
    this.onBookChange();
  }

  openTocFromPicker(row: BookSearchTocRow): void {
    this.bookPickerOpen = false;
    void this.openTocRow(row, true);
  }

  onReaderViewportScroll(): void {
    const viewport = this.readerViewport?.nativeElement;
    if (!viewport) return;
    if (!this.selectedChunk) return;
    if (this.readerLoading || this.autoAdvanceInFlight || this.editorEditing) return;

    const nearBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 120;
    if (!nearBottom) return;

    const targetKey = this.nextAutoAdvanceTargetKey();
    if (!targetKey) return;

    const fromId = this.isTocReader
      ? this.selectedChunk.toc_id ?? this.selectedChunk.chunk_id
      : this.selectedChunk.chunk_id;
    const key = `${fromId}->${targetKey}`;
    const now = Date.now();
    if (this.autoAdvanceLastKey === key && now - this.autoAdvanceLastAt < 900) return;
    this.autoAdvanceLastKey = key;
    this.autoAdvanceLastAt = now;
    this.autoAdvanceInFlight = true;

    const runner = this.openReaderNext(false);
    void runner.finally(() => {
      this.autoAdvanceInFlight = false;
    });
  }

  onReaderPageInView(pageNo: number | null): void {
    if (pageNo === null || !Number.isFinite(Number(pageNo))) return;
    const currentPage = Math.max(1, Math.trunc(Number(pageNo)));
    if (this.activeReaderPageNo === currentPage) return;
    this.activeReaderPageNo = currentPage;
    const nextTocId = this.activeTocIdForPage(currentPage);
    const tocChanged = !!nextTocId && nextTocId !== this.activeTocId;
    if (tocChanged) {
      this.activeTocId = nextTocId;
    }
    this.refreshMainIndexesForActiveToc();
    if (tocChanged) {
      this.scrollActiveTocCardIntoView();
    }
  }

  openSearchRow(row: SearchRow): void {
    void (async () => {
      const opened = await this.openSearchResultRow(row, true);
      if (opened) {
        return;
      }
      this.readerError = 'No linked page found for this search result.';
    })();
  }

  openReadRow(row: BookSearchPageRow): void {
    if (row.page_no !== null) {
      void this.jumpReaderToPage(row.page_no, true);
      return;
    }
    void (async () => {
      const resolved = await this.resolvePageFromChunkId(row.chunk_id);
      if (resolved !== null) {
        await this.jumpReaderToPage(resolved, true);
        return;
      }
      this.readerError = 'No linked page found for this row.';
    })();
  }

  openIndexRow(row: BookSearchIndexRow): void {
    this.activeIndexId = row.index_id;
    this.activeIndexTerm = String(row.term_norm ?? row.term_raw ?? '').trim();
    if (row.index_page_no !== null) {
      void this.jumpReaderToPage(row.index_page_no, true);
      return;
    }
    if (row.target_chunk_id) {
      void (async () => {
        const resolved = await this.resolvePageFromChunkId(row.target_chunk_id ?? '');
        if (resolved !== null) {
          await this.jumpReaderToPage(resolved, true);
          return;
        }
        this.readerError = 'No linked page found for this index term.';
      })();
      return;
    }
    if (row.head_chunk_id) {
      void (async () => {
        const resolved = await this.resolvePageFromChunkId(row.head_chunk_id ?? '');
        if (resolved !== null) {
          await this.jumpReaderToPage(resolved, true);
          return;
        }
        this.readerError = 'No linked page found for this index term.';
      })();
      return;
    }
    this.readerError = 'No linked page found for this index term.';
  }

  openTocMainIndexHit(hit: TocMainIndexHit): void {
    this.activeIndexId = hit.index_id;
    this.activeIndexTerm = String(hit.term ?? '').trim();
    if (hit.target_page !== null) {
      void this.jumpReaderToPage(hit.target_page, true);
      return;
    }
    this.openIndexRow(hit.row);
  }

  async openTocRow(row: BookSearchTocRow, moveToReaderTab = true): Promise<void> {
    if (row.toc_id) {
      this.activeIndexId = '';
      this.activeIndexTerm = '';
      this.activeTocId = row.toc_id;
      this.refreshMainIndexesForActiveToc();
      this.scrollActiveTocCardIntoView();
    }
    if (row.page_no !== null) {
      await this.jumpReaderToPage(row.page_no, moveToReaderTab, 'from-page');
      return;
    }
    if (row.target_chunk_id) {
      const resolved = await this.resolvePageFromChunkId(row.target_chunk_id);
      if (resolved !== null) {
        await this.jumpReaderToPage(resolved, moveToReaderTab, 'from-page');
        return;
      }
    }
    if (row.toc_id) {
      const resolved = await this.resolvePageFromTocId(row.toc_id);
      if (resolved !== null) {
        await this.jumpReaderToPage(resolved, moveToReaderTab, 'from-page');
        return;
      }
    }
    this.readerError = `No linked page found for TOC: ${row.title_norm || row.title_raw}`;
  }

  private async jumpReaderToPage(pageNo: number, moveToReaderTab: boolean, mode: ReaderJumpMode = 'around'): Promise<void> {
    const sourceCode = this.selectedSourceCode;
    const target = Math.max(1, Math.trunc(Number(pageNo)));
    if (!sourceCode || !Number.isFinite(target)) return;
    this.jumpPageNo = target;
    this.readerError = '';
    this.syncUrl();
    if (!this.bookReader) {
      this.pendingJumpPage = target;
      this.pendingJumpSource = sourceCode;
      this.pendingJumpMode = mode;
    } else {
      this.pendingJumpPage = null;
      this.pendingJumpSource = '';
      this.pendingJumpMode = 'around';
      await this.bookReader.jumpToPage(target, sourceCode, mode);
    }
    this.activeReaderPageNo = target;
    this.activeTocId = this.activeTocIdForPage(target);
    this.refreshMainIndexesForActiveToc();
    this.scrollActiveTocCardIntoView();
    if (moveToReaderTab && this.isCompact) {
      this.mobileTab = 'reader';
    }
  }

  private async resolvePageFromChunkId(chunkId: string): Promise<number | null> {
    const id = String(chunkId ?? '').trim();
    if (!id) return null;
    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ chunk_id: id }));
      return res.chunk?.page_no ?? null;
    } catch {
      return null;
    }
  }

  private async resolvePageFromTocId(tocId: string): Promise<number | null> {
    const id = String(tocId ?? '').trim();
    if (!id) return null;
    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ toc_id: id }));
      return res.chunk?.page_no ?? null;
    } catch {
      return null;
    }
  }

  private async openReaderPrev(moveToReaderTab: boolean): Promise<boolean> {
    const chunk = this.selectedChunk;
    if (!chunk) return false;

    if (this.isTocReader) {
      if (this.readerNav.prev_toc_id) {
        const opened = await this.openChunkByToc(this.readerNav.prev_toc_id, moveToReaderTab, { suppressEmptyError: true });
        if (opened) return true;
      }
      if (chunk.source_code && this.readerNav.prev_page_no !== null) {
        await this.openChunkByPage(chunk.source_code, this.readerNav.prev_page_no, moveToReaderTab);
        return true;
      }
      return false;
    }

    if (this.readerNav.prev_chunk_id) {
      await this.openChunkById(this.readerNav.prev_chunk_id, moveToReaderTab);
      return true;
    }
    if (chunk.source_code && this.readerNav.prev_page_no !== null) {
      await this.openChunkByPage(chunk.source_code, this.readerNav.prev_page_no, moveToReaderTab);
      return true;
    }
    return false;
  }

  private async openReaderNext(moveToReaderTab: boolean): Promise<boolean> {
    const chunk = this.selectedChunk;
    if (!chunk) return false;

    if (this.isTocReader) {
      if (this.readerNav.next_toc_id) {
        const opened = await this.openChunkByToc(this.readerNav.next_toc_id, moveToReaderTab, { suppressEmptyError: true });
        if (opened) return true;
      }
      if (chunk.source_code && this.readerNav.next_page_no !== null) {
        await this.openChunkByPage(chunk.source_code, this.readerNav.next_page_no, moveToReaderTab);
        return true;
      }
      return false;
    }

    if (this.readerNav.next_chunk_id) {
      await this.openChunkById(this.readerNav.next_chunk_id, moveToReaderTab);
      return true;
    }
    if (chunk.source_code && this.readerNav.next_page_no !== null) {
      await this.openChunkByPage(chunk.source_code, this.readerNav.next_page_no, moveToReaderTab);
      return true;
    }
    return false;
  }

  private nextAutoAdvanceTargetKey(): string {
    const chunk = this.selectedChunk;
    if (!chunk) return '';
    if (this.isTocReader) {
      if (this.readerNav.next_toc_id) return `toc:${this.readerNav.next_toc_id}`;
      if (this.readerNav.next_page_no !== null && this.readerNav.next_page_no !== chunk.page_no) {
        return `page:${this.readerNav.next_page_no}`;
      }
      return '';
    }
    if (this.readerNav.next_chunk_id) return `chunk:${this.readerNav.next_chunk_id}`;
    if (this.readerNav.next_page_no !== null && this.readerNav.next_page_no !== chunk.page_no) {
      return `page:${this.readerNav.next_page_no}`;
    }
    return '';
  }

  openPrev(): void {
    void this.openReaderPrev(true);
  }

  openNext(): void {
    void this.openReaderNext(true);
  }

  openLinearPrevPage(): void {
    if (this.isTocReader) return;
    const chunk = this.selectedChunk;
    if (!chunk || chunk.page_no === null) return;
    const target = Number(chunk.page_no) - 1;
    if (!Number.isFinite(target) || target < 0) return;
    void this.openChunkByPage(chunk.source_code, target, true);
  }

  openLinearNextPage(): void {
    if (this.isTocReader) return;
    const chunk = this.selectedChunk;
    if (!chunk || chunk.page_no === null) return;
    const target = Number(chunk.page_no) + 1;
    if (!Number.isFinite(target)) return;
    void this.openChunkByPage(chunk.source_code, target, true);
  }

  startEdit(): void {
    if (!this.selectedChunk || this.isTocReader) return;
    this.editorEditing = true;
    this.editorError = '';
    this.editorMessage = '';
    this.populateEditorFromChunk(this.selectedChunk);
  }

  cancelEdit(): void {
    this.editorEditing = false;
    this.editorError = '';
    if (this.selectedChunk) {
      this.populateEditorFromChunk(this.selectedChunk);
    }
  }

  async saveEdit(): Promise<void> {
    if (!this.selectedChunk || this.isTocReader) return;
    this.editorSaving = true;
    this.editorError = '';
    this.editorMessage = '';

    try {
      const payload = {
        chunk_id: this.selectedChunk.chunk_id,
        page_no: this.editPageNo,
        heading_raw: this.editHeadingRaw.trim() || null,
        locator: this.editLocator.trim() || null,
        chunk_type: this.editChunkType.trim().toLowerCase() || null,
        text: this.editText,
      };

      const res = await firstValueFrom(this.bookSearch.updateChunk(payload));
      if (!res.chunk) {
        this.editorError = 'Save succeeded but chunk reload failed.';
        return;
      }

      this.selectedChunk = res.chunk;
      this.readerNav = this.normalizeReaderNav(res.nav);
      this.activeChunkId = res.chunk.chunk_id;
      this.activeTocId = this.activeTocIdForPage(res.chunk.page_no);
      this.jumpPageNo = res.chunk.page_no;
      this.populateEditorFromChunk(res.chunk);
      this.editorEditing = false;
      this.editorMessage = 'Saved.';
      this.invalidateSourceCaches(this.selectedSourceCode);
      await this.loadCurrentList(false);
      this.syncUrl();
    } catch (err: unknown) {
      this.editorError = err instanceof Error ? err.message : 'Save failed.';
    } finally {
      this.editorSaving = false;
    }
  }

  async copyChunkText(): Promise<void> {
    if (!this.selectedChunk?.text) return;
    try {
      await navigator.clipboard.writeText(this.selectedChunk.text);
    } catch {
      this.readerError = 'Copy failed. Clipboard may be blocked.';
    }
  }

  readerTextStyle(): Record<string, string> {
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

  readerTextHtml(): SafeHtml {
    const rawSource = this.editorEditing ? this.editText : this.selectedChunk?.text ?? '';
    const raw = this.isTocReader ? this.flattenTocReaderText(rawSource) : rawSource;
    const terms = this.editorEditing ? [] : this.searchTermsFromQuery(this.query);
    const html = this.highlightText(raw, terms);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  trackByChunkId = (_: number, row: { chunk_id: string }) => row.chunk_id;
  trackByIndexId = (_: number, row: { index_id: string }) => row.index_id;
  trackByTocId = (_: number, row: { toc_id: string }) => row.toc_id;
  trackByTocMainIndexId = (_: number, row: TocMainIndexHit) => row.index_id;
  trackBySourceCode = (_: number, row: { source_code: string }) => row.source_code;

  bookDisplayName(row: Pick<BookSearchSource, 'title' | 'source_code'>): string {
    const title = String(row.title ?? '').trim();
    if (!title) return row.source_code;
    if (title.toLowerCase() === row.source_code.toLowerCase()) return row.source_code;
    return title;
  }

  termLabel(row: BookSearchIndexRow): string {
    const heading = row.term_raw?.trim() || row.term_norm?.trim() || row.index_id;
    const page = row.index_page_no ?? '—';
    return `${heading} (p.${page})`;
  }

  indexRefsLabel(row: BookSearchIndexRow): string {
    if (!row.page_refs_json) return '—';
    try {
      const refs = JSON.parse(row.page_refs_json) as Array<{
        from?: number | null;
        to?: number | null;
        is_main?: boolean;
        note?: string | null;
      }>;
      if (!Array.isArray(refs) || !refs.length) return '—';
      const parts = refs.slice(0, 4).map((ref) => {
        const from = Number.isFinite(Number(ref.from)) ? Number(ref.from) : null;
        const to = Number.isFinite(Number(ref.to)) ? Number(ref.to) : from;
        const range = from === null ? '—' : from === to ? `${from}` : `${from}-${to}`;
        const main = ref.is_main ? '*' : '';
        const note = ref.note ? ` (${ref.note})` : '';
        return `${range}${main}${note}`;
      });
      const suffix = refs.length > 4 ? ` +${refs.length - 4}` : '';
      return parts.join(', ') + suffix;
    } catch {
      return '—';
    }
  }

  private async loadBooksAndBootstrap(): Promise<void> {
    this.booksLoading = true;
    this.booksError = '';
    try {
      const res = await firstValueFrom(this.bookSearch.listSources({ limit: 300, offset: 0 }));
      this.books = res.results ?? [];

      if (this.selectedSourceCode && !this.books.some((b) => b.source_code === this.selectedSourceCode)) {
        this.selectedSourceCode = '';
      }
      if (!this.selectedSourceCode && this.books.length) {
        this.selectedSourceCode = this.books[0].source_code;
      }

      await this.reloadBookData(false);

      let openedByQuery = false;
      if (this.query.trim()) {
        openedByQuery = await this.openInitialSearchResult(false);
      }

      if (!openedByQuery) {
        const tocId = this.initialTocId;
        const chunkId = this.initialChunkId;
        if (tocId) {
          const fromToc = this.tocRows.find((row) => row.toc_id === tocId);
          if (fromToc) {
            await this.openTocRow(fromToc, false);
          } else if (chunkId) {
            const page = await this.resolvePageFromChunkId(chunkId);
            if (page !== null) {
              await this.jumpReaderToPage(page, false);
            }
          } else {
            const page = await this.resolvePageFromTocId(tocId);
            if (page !== null) {
              await this.jumpReaderToPage(page, false);
            } else {
              this.readerError = 'Unable to render this TOC entry.';
            }
          }
        } else if (chunkId) {
          const page = await this.resolvePageFromChunkId(chunkId);
          if (page !== null) {
            await this.jumpReaderToPage(page, false);
          }
        } else if (this.jumpPageNo !== null) {
          await this.jumpReaderToPage(this.jumpPageNo, false);
        } else {
          const firstToc = this.tocRows.find((row) => row.page_no !== null);
          if (firstToc?.page_no !== null && firstToc?.page_no !== undefined) {
            await this.jumpReaderToPage(firstToc.page_no, false);
          }
        }
      }
      this.initialChunkId = '';
      this.initialTocId = '';
      this.syncUrl();
    } catch (err: unknown) {
      this.booksError = err instanceof Error ? err.message : 'Failed to load books.';
    } finally {
      this.booksLoading = false;
    }
  }

  private async loadCurrentList(moveToResultsTab: boolean): Promise<void> {
    await this.loadReadRows(moveToResultsTab);
    if (this.query.trim()) {
      await this.loadSearchRows(false);
    }
  }

  private async reloadBookData(moveToResultsTab: boolean): Promise<void> {
    if (this.hasReadFilters()) {
      await Promise.all([this.loadAllIndexRows(), this.loadCurrentList(moveToResultsTab), this.loadAllTocRows()]);
    } else {
      await Promise.all([this.loadAllIndexRows(), this.loadCurrentList(moveToResultsTab)]);
      this.allTocRows = [...this.tocRows];
      this.setCachedMapEntry(this.allTocCache, this.cacheScopeKey(), [...this.allTocRows]);
      this.refreshMainIndexesForActiveToc();
    }
  }

  private async openInitialSearchResult(moveToReaderTab: boolean): Promise<boolean> {
    const row = this.searchRows[0];
    if (!row) return false;
    return this.openSearchResultRow(row, moveToReaderTab);
  }

  private async openSearchResultRow(row: SearchRow, moveToReaderTab: boolean): Promise<boolean> {
    if (row.page_no !== null) {
      await this.jumpReaderToPage(row.page_no, moveToReaderTab);
      return true;
    }

    const resolved = await this.resolvePageFromChunkId(row.chunk_id);
    if (resolved === null) {
      return false;
    }
    await this.jumpReaderToPage(resolved, moveToReaderTab);
    return true;
  }

  private async loadSearchRows(moveToResultsTab: boolean): Promise<void> {
    const requestId = ++this.searchRequestSeq;
    this.searchLoading = true;
    this.searchError = '';

    try {
      if (!this.selectedSourceCode) {
        this.searchRows = [];
        this.searchTotal = 0;
        this.searchError = 'Select a book first.';
        return;
      }

      const query = this.query.trim();
      if (!query) {
        this.searchRows = [];
        this.searchTotal = 0;
        return;
      }

      const cacheKey = this.searchCacheKey(query);
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        this.searchRows = [...cached.rows];
        this.searchTotal = cached.total;
        return;
      }

      const res = await firstValueFrom(
        this.bookSearch.searchChunks({
          source_code: this.selectedSourceCode,
          q: query,
          page_from: this.pageFrom ?? undefined,
          page_to: this.pageTo ?? undefined,
          heading_norm: this.headingFilter.trim() || undefined,
          limit: 50,
          offset: 0,
        })
      );
      if (requestId !== this.searchRequestSeq) return;

      this.searchTotal = res.total ?? 0;
      this.searchRows = (res.results ?? []).map((row: BookSearchChunkHit) => ({
        chunk_id: row.chunk_id,
        page_no: row.page_no,
        heading_raw: row.heading_raw,
        snippet_html: this.snippetHtml(row.hit),
      }));
      this.setCachedMapEntry(this.searchCache, cacheKey, {
        rows: [...this.searchRows],
        total: this.searchTotal,
      });
    } catch (err: unknown) {
      if (requestId !== this.searchRequestSeq) return;
      this.searchRows = [];
      this.searchTotal = 0;
      this.searchError = err instanceof Error ? err.message : 'Search failed.';
    } finally {
      if (requestId !== this.searchRequestSeq) return;
      this.searchLoading = false;
      if (moveToResultsTab && this.isCompact) {
        this.mobileTab = 'books';
      }
    }
  }

  private async loadReadRows(moveToResultsTab: boolean): Promise<void> {
    const requestId = ++this.readRequestSeq;
    this.readLoading = true;
    this.readError = '';

    try {
      if (!this.selectedSourceCode) {
        this.readRows = [];
        this.indexRows = [];
        this.tocRows = [];
        this.readTotal = 0;
        this.readError = 'Select a book first.';
        return;
      }

      const cacheKey = this.filteredTocCacheKey();
      const cached = this.filteredTocCache.get(cacheKey);
      if (cached) {
        this.readRows = [];
        this.indexRows = [];
        this.tocRows = [...cached.rows];
        this.readTotal = cached.total;
        if (!this.hasReadFilters()) {
          this.allTocRows = [...this.tocRows];
          this.setCachedMapEntry(this.allTocCache, this.cacheScopeKey(), [...this.allTocRows]);
        }
        this.refreshMainIndexesForActiveToc();
        return;
      }

      const res = await firstValueFrom(
        this.bookSearch.listToc({
          source_code: this.selectedSourceCode,
          heading_norm: this.headingFilter.trim() || undefined,
          page_from: this.pageFrom ?? undefined,
          page_to: this.pageTo ?? undefined,
          limit: 5000,
          offset: 0,
        })
      );
      if (requestId !== this.readRequestSeq) return;

      this.readRows = [];
      this.indexRows = [];
      this.tocRows = this.sortTocRows(res.results ?? []);
      this.readTotal = res.total ?? this.tocRows.length;
      this.setCachedMapEntry(this.filteredTocCache, cacheKey, {
        rows: [...this.tocRows],
        total: this.readTotal,
      });
      if (!this.hasReadFilters()) {
        this.allTocRows = [...this.tocRows];
        this.setCachedMapEntry(this.allTocCache, this.cacheScopeKey(), [...this.allTocRows]);
      }
      this.refreshMainIndexesForActiveToc();
    } catch (err: unknown) {
      if (requestId !== this.readRequestSeq) return;
      this.readRows = [];
      this.indexRows = [];
      this.tocRows = [];
      this.readTotal = 0;
      this.readError = this.describeApiError(err, 'Failed to load entries.');
      this.refreshMainIndexesForActiveToc();
    } finally {
      if (requestId !== this.readRequestSeq) return;
      this.readLoading = false;
      if (moveToResultsTab && this.isCompact) {
        this.mobileTab = 'books';
      }
    }
  }

  private async loadTermRows(): Promise<void> {
    this.termsLoading = true;
    this.termsError = '';
    this.termRows = [];

    try {
      if (!this.selectedSourceCode) return;

      const res = await firstValueFrom(
        this.bookSearch.listIndex({
          source_code: this.selectedSourceCode,
          limit: 5000,
          offset: 0,
        })
      );

      this.termRows = res.results ?? [];
      if (this.selectedTermChunkId && !this.termRows.some((row) => row.index_id === this.selectedTermChunkId)) {
        this.selectedTermChunkId = '';
      }
    } catch (err: unknown) {
      this.termsError = err instanceof Error ? err.message : 'Failed to load terms.';
    } finally {
      this.termsLoading = false;
    }
  }

  private async loadAllTocRows(): Promise<void> {
    this.allTocRows = [];
    try {
      if (!this.selectedSourceCode) return;
      const cacheKey = this.cacheScopeKey();
      const cached = this.allTocCache.get(cacheKey);
      if (cached) {
        this.allTocRows = [...cached];
        this.refreshMainIndexesForActiveToc();
        return;
      }
      const res = await firstValueFrom(
        this.bookSearch.listToc({
          source_code: this.selectedSourceCode,
          limit: 5000,
          offset: 0,
        })
      );
      this.allTocRows = this.sortTocRows(res.results ?? []);
      this.setCachedMapEntry(this.allTocCache, cacheKey, [...this.allTocRows]);
      this.refreshMainIndexesForActiveToc();
    } catch {
      this.allTocRows = [];
      this.refreshMainIndexesForActiveToc();
    }
  }

  private async loadAllIndexRows(): Promise<void> {
    this.allIndexRows = [];
    this.tocMainIndexHits = [];
    this.pageIndexHits = [];
    this.refsByIndexId.clear();
    this.pageIndexHitsCache.clear();
    this.tocRangeMainIndexCache.clear();
    this.indexError = '';
    this.indexLoading = true;

    try {
      if (!this.selectedSourceCode) return;
      const cacheKey = this.cacheScopeKey();
      const cached = this.allIndexCache.get(cacheKey);
      if (cached) {
        this.applyAllIndexRows(cached);
        this.refreshMainIndexesForActiveToc();
        return;
      }
      const res = await firstValueFrom(
        this.bookSearch.listIndex({
          source_code: this.selectedSourceCode,
          limit: 5000,
          offset: 0,
        })
      );
      this.applyAllIndexRows(res.results ?? []);
      this.setCachedMapEntry(this.allIndexCache, cacheKey, [...this.allIndexRows]);
      this.refreshMainIndexesForActiveToc();
    } catch (err: unknown) {
      this.allIndexRows = [];
      this.tocMainIndexHits = [];
      this.pageIndexHits = [];
      this.refsByIndexId.clear();
      this.pageIndexHitsCache.clear();
      this.tocRangeMainIndexCache.clear();
      this.indexError = this.describeApiError(err, 'Failed to load index entries.');
    } finally {
      this.indexLoading = false;
    }
  }

  private applyAllIndexRows(rows: BookSearchIndexRow[]): void {
    this.allIndexRows = [...rows];
    this.refsByIndexId.clear();
    this.pageIndexHitsCache.clear();
    this.tocRangeMainIndexCache.clear();
    for (const row of this.allIndexRows) {
      this.refsByIndexId.set(row.index_id, this.extractRefs(row.page_refs_json));
    }
  }

  private async openChunkById(chunkId: string, moveToReaderTab: boolean): Promise<void> {
    if (!chunkId) return;
    this.readerLoading = true;
    this.readerError = '';

    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ chunk_id: chunkId }));
      await this.applyReaderPayload(res, 'Chunk not found.', moveToReaderTab);
    } catch (err: unknown) {
      this.readerError = err instanceof Error ? err.message : 'Unable to load chunk.';
    } finally {
      this.readerLoading = false;
    }
  }

  private async openChunkByPage(sourceCode: string, pageNo: number, moveToReaderTab: boolean): Promise<void> {
    this.readerLoading = true;
    this.readerError = '';

    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ source_code: sourceCode, page_no: pageNo }));
      await this.applyReaderPayload(res, `No chunk found at page ${pageNo}.`, moveToReaderTab);
    } catch (err: unknown) {
      this.readerError = err instanceof Error ? err.message : 'Unable to open page.';
    } finally {
      this.readerLoading = false;
    }
  }

  private async openChunkByToc(
    tocId: string,
    moveToReaderTab: boolean,
    options?: { suppressEmptyError?: boolean }
  ): Promise<boolean> {
    if (!tocId) return false;
    this.readerLoading = true;
    this.readerError = '';

    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ toc_id: tocId }));
      if (!res.chunk) {
        if (!options?.suppressEmptyError) {
          this.readerError = 'Unable to render this TOC entry.';
        }
        return false;
      }
      await this.applyReaderPayload(res, 'Unable to render this TOC entry.', moveToReaderTab);
      return true;
    } catch (err: unknown) {
      this.readerError = err instanceof Error ? err.message : 'Unable to open TOC section.';
      return false;
    } finally {
      this.readerLoading = false;
    }
  }

  private async applyReaderPayload(
    res: { chunk: BookSearchReaderChunk | null; nav: BookSearchReaderNav },
    emptyMessage: string,
    moveToReaderTab: boolean
  ): Promise<void> {
    if (!res.chunk) {
      this.readerError = emptyMessage;
      this.clearReaderSelection();
      return;
    }

    if (res.chunk.source_code && res.chunk.source_code !== this.selectedSourceCode) {
      this.selectedSourceCode = res.chunk.source_code;
      await this.reloadBookData(false);
    }

    this.selectedChunk = res.chunk;
    this.readerNav = this.normalizeReaderNav(res.nav);
    this.activeChunkId = this.isReaderChunkToc(res.chunk) ? '' : res.chunk.chunk_id;
    this.activeTocId = this.isReaderChunkToc(res.chunk)
      ? (res.chunk.toc_id ?? '')
      : this.activeTocIdForPage(res.chunk.page_no);
    this.jumpPageNo = res.chunk.page_no;
    this.activeReaderPageNo = res.chunk.page_no;
    this.refreshMainIndexesForActiveToc();
    this.scrollActiveTocCardIntoView();

    if (this.isReaderChunkToc(res.chunk)) {
      this.editorEditing = false;
      this.editorError = '';
      this.editorMessage = '';
    } else {
      this.populateEditorFromChunk(res.chunk);
      this.editorEditing = false;
      this.editorError = '';
      this.editorMessage = '';
    }

    this.scrollReaderTop();
    this.syncUrl();

    if (moveToReaderTab && this.isCompact) {
      this.mobileTab = 'reader';
    }
  }

  private normalizeReaderNav(nav: BookSearchReaderNav | null | undefined): BookSearchReaderNav {
    return {
      prev_chunk_id: nav?.prev_chunk_id ?? null,
      prev_page_no: nav?.prev_page_no ?? null,
      next_chunk_id: nav?.next_chunk_id ?? null,
      next_page_no: nav?.next_page_no ?? null,
      prev_toc_id: nav?.prev_toc_id ?? null,
      next_toc_id: nav?.next_toc_id ?? null,
    };
  }

  private isReaderChunkToc(chunk: BookSearchReaderChunk | null | undefined): boolean {
    return chunk?.reader_scope === 'toc' || !!chunk?.toc_id;
  }

  private refreshMainIndexesForActiveToc(): void {
    const { start, end } = this.activeTocRange();
    this.activeTocRangeStart = start;
    this.activeTocRangeEnd = end;

    if (!this.allIndexRows.length) {
      this.tocMainIndexHits = [];
      this.pageIndexHits = [];
      this.activeIndexId = '';
      return;
    }

    this.tocMainIndexHits =
      start === null ? [] : this.collectIndexHitsForRange(start, end, { mainOnly: true, showMainMarker: false });

    const activePage = this.pageValue(this.activeReaderPageNo);
    this.pageIndexHits = activePage === null ? [] : this.collectIndexHitsForPage(activePage);

    if (
      this.activeIndexId &&
      !this.tocMainIndexHits.some((hit) => hit.index_id === this.activeIndexId) &&
      !this.pageIndexHits.some((hit) => hit.index_id === this.activeIndexId)
    ) {
      this.activeIndexId = '';
    }
  }

  private activeTocRange(): { start: number | null; end: number | null } {
    const activeId = String(this.activeTocId ?? '').trim();
    if (!activeId || !this.allTocRows.length) {
      return { start: null, end: null };
    }
    const idx = this.allTocRows.findIndex((row) => row.toc_id === activeId);
    if (idx < 0) {
      return { start: null, end: null };
    }

    const current = this.allTocRows[idx];
    let start = this.pageValue(current.page_no);
    if (start === null) {
      for (let i = idx - 1; i >= 0; i -= 1) {
        const candidate = this.pageValue(this.allTocRows[i].page_no);
        if (candidate !== null) {
          start = candidate;
          break;
        }
      }
    }

    let nextStart: number | null = null;
    for (let i = idx + 1; i < this.allTocRows.length; i += 1) {
      const candidate = this.pageValue(this.allTocRows[i].page_no);
      if (candidate !== null) {
        nextStart = candidate;
        break;
      }
    }

    const end = start === null || nextStart === null ? null : Math.max(start, nextStart - 1);
    return { start, end };
  }

  private pageValue(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(1, Math.trunc(parsed));
  }

  private collectIndexHitsForRange(
    start: number,
    end: number | null,
    options: { mainOnly: boolean; showMainMarker: boolean }
  ): TocMainIndexHit[] {
    const cacheKey = `${start}:${end ?? 'x'}:${options.mainOnly ? 1 : 0}:${options.showMainMarker ? 1 : 0}`;
    const cached = this.tocRangeMainIndexCache.get(cacheKey);
    if (cached) {
      return [...cached];
    }

    const hits: TocMainIndexHit[] = [];
    for (const row of this.allIndexRows) {
      const refs = this.filterRefsForRange(this.refsByIndexId.get(row.index_id) ?? [], start, end, options.mainOnly);
      if (!refs.length) continue;
      const firstFrom = refs[0]?.from ?? start;
      const targetPage = end === null ? Math.max(start, firstFrom) : Math.min(Math.max(start, firstFrom), end);
      hits.push({
        index_id: row.index_id,
        term: this.indexTermLabel(row),
        target_page: targetPage,
        refs_label: this.refsLabel(refs, options.showMainMarker),
        row,
      });
    }
    const sorted = this.sortIndexHits(hits);
    this.setCachedMapEntry(this.tocRangeMainIndexCache, cacheKey, [...sorted], 240);
    return sorted;
  }

  private collectIndexHitsForPage(pageNo: number): TocMainIndexHit[] {
    const cached = this.pageIndexHitsCache.get(pageNo);
    if (cached) {
      return [...cached];
    }

    const hits: TocMainIndexHit[] = [];
    for (const row of this.allIndexRows) {
      const refs = this.filterRefsForPage(this.refsByIndexId.get(row.index_id) ?? [], pageNo);
      if (!refs.length) continue;
      hits.push({
        index_id: row.index_id,
        term: this.indexTermLabel(row),
        target_page: pageNo,
        refs_label: this.refsLabel(refs, true),
        row,
      });
    }
    const sorted = this.sortIndexHits(hits);
    this.setCachedMapEntry(this.pageIndexHitsCache, pageNo, [...sorted], 400);
    return sorted;
  }

  private sortIndexHits(hits: TocMainIndexHit[]): TocMainIndexHit[] {
    return hits.sort((a, b) => {
      const pageA = a.target_page ?? Number.MAX_SAFE_INTEGER;
      const pageB = b.target_page ?? Number.MAX_SAFE_INTEGER;
      if (pageA !== pageB) return pageA - pageB;
      return a.term.localeCompare(b.term, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  private indexTermLabel(row: BookSearchIndexRow): string {
    return String(row.term_norm ?? row.term_raw ?? row.index_id).trim() || row.index_id;
  }

  private extractRefs(pageRefsJson: string): IndexRef[] {
    if (!pageRefsJson) return [];
    try {
      const parsed = JSON.parse(pageRefsJson) as Array<{
        from?: number | null;
        to?: number | null;
        is_main?: boolean;
        note?: string | null;
      }>;
      if (!Array.isArray(parsed)) return [];
      const refs: IndexRef[] = [];
      for (const item of parsed) {
        const fromRaw = this.pageValue(item.from);
        const toRaw = this.pageValue(item.to);
        if (fromRaw === null && toRaw === null) continue;
        const from = fromRaw ?? toRaw ?? 0;
        const to = toRaw ?? fromRaw ?? from;
        refs.push({
          from: Math.min(from, to),
          to: Math.max(from, to),
          note: item.note ? String(item.note).trim() || null : null,
          is_main: !!item.is_main,
        });
      }
      refs.sort((a, b) => (a.from !== b.from ? a.from - b.from : a.to - b.to));
      return refs;
    } catch {
      return [];
    }
  }

  private filterRefsForRange(refs: IndexRef[], start: number, end: number | null, mainOnly: boolean): IndexRef[] {
    return refs.filter((ref) => {
      if (mainOnly && !ref.is_main) return false;
      if (ref.to < start) return false;
      if (end !== null && ref.from > end) return false;
      return true;
    });
  }

  private filterRefsForPage(refs: IndexRef[], pageNo: number): IndexRef[] {
    return refs.filter((ref) => ref.from <= pageNo && ref.to >= pageNo);
  }

  private refsLabel(refs: IndexRef[], showMainMarker: boolean): string {
    const labels = refs.slice(0, 4).map((ref) => {
      const range = ref.from === ref.to ? `${ref.from}` : `${ref.from}-${ref.to}`;
      const marker = showMainMarker && ref.is_main ? '*' : '';
      return ref.note ? `${range}${marker} (${ref.note})` : `${range}${marker}`;
    });
    const suffix = refs.length > 4 ? ` +${refs.length - 4}` : '';
    return labels.join(', ') + suffix;
  }

  private scrollActiveTocCardIntoView(): void {
    setTimeout(() => {
      const host = this.tocCatalog?.nativeElement;
      if (!host) return;
      const active = host.querySelector<HTMLElement>('.toc-card.is-active');
      active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, 0);
  }

  private sortTocRows(rows: BookSearchTocRow[]): BookSearchTocRow[] {
    return [...rows].sort((a, b) => {
      const pathCmp = this.compareIndexPath(a.index_path, b.index_path);
      if (pathCmp !== 0) return pathCmp;
      if (a.depth !== b.depth) return a.depth - b.depth;
      const pageA = a.page_no ?? Number.MAX_SAFE_INTEGER;
      const pageB = b.page_no ?? Number.MAX_SAFE_INTEGER;
      if (pageA !== pageB) return pageA - pageB;
      return a.toc_id.localeCompare(b.toc_id);
    });
  }

  private activeTocIdForPage(pageNo: number | null): string {
    if (pageNo === null) return '';
    let best: BookSearchTocRow | null = null;
    for (const row of this.allTocRows) {
      if (row.page_no === null || row.page_no > pageNo) continue;
      if (!best) {
        best = row;
        continue;
      }
      const rowPage = row.page_no ?? -1;
      const bestPage = best.page_no ?? -1;
      if (rowPage > bestPage) {
        best = row;
        continue;
      }
      if (rowPage === bestPage && this.compareIndexPath(row.index_path, best.index_path) > 0) {
        best = row;
      }
    }
    return best?.toc_id ?? '';
  }

  private compareIndexPath(aPath: string | null | undefined, bPath: string | null | undefined): number {
    const a = String(aPath ?? '').trim();
    const b = String(bPath ?? '').trim();
    if (a && !b) return -1;
    if (!a && b) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  private hasReadFilters(): boolean {
    return this.pageFrom !== null || this.pageTo !== null || !!this.headingFilter.trim();
  }

  private cacheScopeKey(): string {
    return String(this.selectedSourceCode ?? '').trim().toLowerCase();
  }

  private filteredTocCacheKey(): string {
    return JSON.stringify({
      source: this.cacheScopeKey(),
      heading: this.headingFilter.trim().toLowerCase(),
      pageFrom: this.pageFrom,
      pageTo: this.pageTo,
    });
  }

  private searchCacheKey(query: string): string {
    return JSON.stringify({
      source: this.cacheScopeKey(),
      query: query.trim().toLowerCase(),
      heading: this.headingFilter.trim().toLowerCase(),
      pageFrom: this.pageFrom,
      pageTo: this.pageTo,
    });
  }

  private setCachedMapEntry<K, V>(map: Map<K, V>, key: K, value: V, maxSize = 48): void {
    if (map.has(key)) {
      map.delete(key);
    }
    map.set(key, value);
    if (map.size <= maxSize) return;
    const firstKey = map.keys().next().value as K;
    map.delete(firstKey);
  }

  private invalidateSourceCaches(sourceCode: string): void {
    const scope = String(sourceCode ?? '').trim().toLowerCase();
    if (!scope) return;
    this.allTocCache.delete(scope);
    this.allIndexCache.delete(scope);
    for (const key of Array.from(this.filteredTocCache.keys())) {
      if (!key.includes(`"source":"${scope}"`)) continue;
      this.filteredTocCache.delete(key);
    }
    for (const key of Array.from(this.searchCache.keys())) {
      if (!key.includes(`"source":"${scope}"`)) continue;
      this.searchCache.delete(key);
    }
  }

  private describeApiError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const raw = err.error as unknown;
      if (typeof raw === 'string' && raw.trim()) return raw;
      if (raw && typeof raw === 'object') {
        const payload = raw as { error?: string; message?: string; detail?: string };
        const message = payload.error || payload.message || payload.detail;
        if (message) return String(message);
      }
      return String(err.message || fallback);
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  private applyQueryParams(): void {
    const qp = this.route.snapshot.queryParamMap;

    const sourceCode = (qp.get('source_code') ?? '').trim();
    if (sourceCode) {
      this.selectedSourceCode = sourceCode;
    }

    this.readTab = 'toc';

    this.query = qp.get('q') ?? '';
    this.headingFilter = qp.get('heading') ?? '';
    this.pageFrom = this.toIntOrNull(qp.get('page_from'));
    this.pageTo = this.toIntOrNull(qp.get('page_to'));
    this.initialChunkId = (qp.get('chunk_id') ?? '').trim();
    this.initialTocId = (qp.get('toc_id') ?? '').trim();

    const jump = this.toIntOrNull(qp.get('jump_page'));
    this.jumpPageNo = jump;
  }

  private syncUrl(): void {
    const queryParams = {
      source_code: this.selectedSourceCode || null,
      view_mode: 'read',
      read_tab: this.readTab,
      q: this.query.trim() || null,
      page_from: this.pageFrom ?? null,
      page_to: this.pageTo ?? null,
      heading: this.headingFilter.trim() || null,
      jump_page: this.jumpPageNo ?? null,
      chunk_id: null,
      toc_id: this.activeTocId || null,
    };
    if (this.isSameQueryState(queryParams)) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private isSameQueryState(next: Record<string, string | number | null>): boolean {
    const current = this.route.snapshot.queryParamMap;
    for (const [key, value] of Object.entries(next)) {
      const currentValue = this.normalizeQueryValue(current.get(key));
      const nextValue = this.normalizeQueryValue(value);
      if (currentValue !== nextValue) {
        return false;
      }
    }
    return true;
  }

  private normalizeQueryValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text ? text : null;
  }

  private toIntOrNull(value: string | null): number | null {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private updateResponsiveState(): void {
    this.isCompact = window.innerWidth <= 1140;
    if (!this.isCompact) {
      this.mobileTab = 'books';
      return;
    }

    if (this.jumpPageNo !== null) {
      this.mobileTab = 'reader';
      return;
    }

    this.mobileTab = 'books';
  }

  private clearReaderSelection(): void {
    this.selectedChunk = null;
    this.activeChunkId = '';
    this.activeTocId = '';
    this.activeIndexId = '';
    this.activeIndexTerm = '';
    this.activeReaderPageNo = null;
    this.activeTocRangeStart = null;
    this.activeTocRangeEnd = null;
    this.tocMainIndexHits = [];
    this.pageIndexHits = [];
    this.readerNav = this.normalizeReaderNav(null);
    this.editorEditing = false;
    this.editorSaving = false;
    this.editorError = '';
    this.editorMessage = '';
    this.editPageNo = null;
    this.editHeadingRaw = '';
    this.editLocator = '';
    this.editChunkType = 'lexicon';
    this.editText = '';
  }

  private scrollReaderTop(): void {
    setTimeout(() => {
      this.readerViewport?.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
  }

  private snippetHtml(value: string | null | undefined): SafeHtml {
    const escaped = this.escapeHtml(String(value ?? ''));
    const html = escaped.replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private flattenTocReaderText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\r\n?/g, '\n')
      .replace(/^\s*=+\s*Page[^\n]*=+\s*$/gim, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  get hasPrevReaderTarget(): boolean {
    const chunk = this.selectedChunk;
    if (!chunk) return false;
    if (this.isTocReader) {
      return !!this.readerNav.prev_toc_id || (!!chunk.source_code && this.readerNav.prev_page_no !== null);
    }
    return !!this.readerNav.prev_chunk_id || (!!chunk.source_code && this.readerNav.prev_page_no !== null);
  }

  get hasNextReaderTarget(): boolean {
    const chunk = this.selectedChunk;
    if (!chunk) return false;
    if (this.isTocReader) {
      return !!this.readerNav.next_toc_id || (!!chunk.source_code && this.readerNav.next_page_no !== null);
    }
    return !!this.readerNav.next_chunk_id || (!!chunk.source_code && this.readerNav.next_page_no !== null);
  }

  private searchTermsFromQuery(query: string): string[] {
    const q = query.trim();
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

  private populateEditorFromChunk(chunk: BookSearchReaderChunk): void {
    this.editPageNo = chunk.page_no;
    this.editHeadingRaw = chunk.heading_raw ?? '';
    this.editLocator = chunk.locator ?? '';
    this.editChunkType = (chunk.chunk_type ?? 'lexicon').toLowerCase();
    this.editText = chunk.text ?? '';
  }
}
