import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { BookSearchService } from '../../../../shared/services/book-search.service';
import { AppHeaderbarComponent, AppTabsComponent, type AppTabItem } from '../../../../shared/components';
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

type SearchRow = {
  chunk_id: string;
  page_no: number | null;
  heading_raw: string | null;
  snippet_html: SafeHtml;
};

@Component({
  selector: 'app-source-chunks-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderbarComponent, AppTabsComponent],
  templateUrl: './source-chunks-page.component.html',
  styleUrls: ['./source-chunks-page.component.scss'],
})
export class SourceChunksPageComponent implements OnInit, OnDestroy {
  @ViewChild('readerViewport') readerViewport?: ElementRef<HTMLDivElement>;

  books: BookSearchSource[] = [];
  booksLoading = false;
  booksError = '';

  selectedSourceCode = '';
  readTab: ReadTab = 'toc';

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

  selectedChunk: BookSearchReaderChunk | null = null;
  activeChunkId = '';
  activeTocId = '';
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
  navigatorWidth = 380;
  readonly minNavigatorWidth = 300;
  readonly maxNavigatorWidth = 560;

  private readonly onResize = () => this.updateResponsiveState();
  private initialChunkId = '';
  private initialTocId = '';

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

  get scopeLabel(): string {
    if (!this.selectedSourceCode) return 'Select a book';
    const source = this.books.find((b) => b.source_code === this.selectedSourceCode);
    return source ? `${source.source_code} — ${source.title}` : this.selectedSourceCode;
  }

  get currentTotal(): number {
    return this.readTotal;
  }

  get tableCountLabel(): string {
    if (this.readTab === 'index') return `${this.currentTotal} index entries`;
    if (this.readTab === 'toc') return `${this.currentTotal} TOC entries`;
    return `${this.currentTotal} pages`;
  }

  get listEmptyMessage(): string {
    if (this.readTab === 'index') return 'No index entries imported for this book';
    if (this.readTab === 'toc') return 'No TOC entries imported for this book';
    return 'No pages imported for this book';
  }

  get readerEmptyMessage(): string {
    if (this.readTab === 'index') return 'Select an index term to read';
    if (this.readTab === 'toc') return 'Select a TOC row to read';
    return 'Select a page to read';
  }

  get isTocReader(): boolean {
    return this.selectedChunk?.reader_scope === 'toc' || !!this.selectedChunk?.toc_id;
  }

  get navigatorTabs(): AppTabItem[] {
    return [
      { id: 'pages', label: 'Pages' },
      { id: 'index', label: 'Index' },
      { id: 'toc', label: 'TOC' },
    ];
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

  onReadTabSelect(tab: AppTabItem): void {
    const tabId = String(tab.id ?? '').toLowerCase();
    if (tabId === 'pages' || tabId === 'index' || tabId === 'toc') {
      this.setReadTab(tabId);
    }
  }

  onBookChange(): void {
    this.clearReaderSelection();
    this.searchError = '';
    this.readError = '';
    this.selectedTermChunkId = '';
    void this.loadTermRows();
    void this.loadAllTocRows();
    void this.loadCurrentList(true);
    this.syncUrl();
  }

  setReadTab(tab: ReadTab): void {
    if (this.readTab === tab) return;
    this.readTab = tab;
    this.clearReaderSelection();
    void this.loadCurrentList(true);
    this.syncUrl();
  }

  runSearch(): void {
    void this.loadSearchRows(true);
    this.syncUrl();
  }

  refreshReadRows(): void {
    void this.loadCurrentList(true);
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
    void this.openChunkByPage(sourceCode, pageNo, true);
  }

  openSelectedTerm(): void {
    if (!this.selectedTermChunkId) return;
    const row = this.termRows.find((item) => item.index_id === this.selectedTermChunkId);
    if (!row) return;
    this.openIndexRow(row);
  }

  openSearchRow(row: SearchRow): void {
    void this.openChunkById(row.chunk_id, true);
  }

  openReadRow(row: BookSearchPageRow): void {
    void this.openChunkById(row.chunk_id, true);
  }

  openIndexRow(row: BookSearchIndexRow): void {
    if (row.target_chunk_id) {
      void this.openChunkById(row.target_chunk_id, true);
      return;
    }
    if (row.head_chunk_id) {
      void this.openChunkById(row.head_chunk_id, true);
      return;
    }
    if (row.index_page_no !== null && this.selectedSourceCode) {
      void this.openChunkByPage(this.selectedSourceCode, row.index_page_no, true);
      return;
    }
    this.readerError = 'No linked page found for this index term.';
  }

  openTocRow(row: BookSearchTocRow): void {
    if (row.toc_id) {
      void this.openChunkByToc(row.toc_id, true);
      return;
    }
    if (row.target_chunk_id) {
      void this.openChunkById(row.target_chunk_id, true);
      return;
    }
    if (row.page_no !== null && this.selectedSourceCode) {
      void this.openChunkByPage(this.selectedSourceCode, row.page_no, true);
      return;
    }
    this.readerError = 'No linked page found for this TOC item.';
  }

  openPrev(): void {
    if (this.isTocReader) {
      if (!this.readerNav.prev_toc_id) return;
      void this.openChunkByToc(this.readerNav.prev_toc_id, true);
      return;
    }
    if (!this.readerNav.prev_chunk_id) return;
    void this.openChunkById(this.readerNav.prev_chunk_id, true);
  }

  openNext(): void {
    if (this.isTocReader) {
      if (!this.readerNav.next_toc_id) return;
      void this.openChunkByToc(this.readerNav.next_toc_id, true);
      return;
    }
    if (!this.readerNav.next_chunk_id) return;
    void this.openChunkById(this.readerNav.next_chunk_id, true);
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
    };
  }

  readerTextHtml(): SafeHtml {
    const raw = this.editorEditing ? this.editText : this.selectedChunk?.text ?? '';
    const terms = this.editorEditing ? [] : this.searchTermsFromQuery(this.query);
    const html = this.highlightText(raw, terms);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  trackByChunkId = (_: number, row: { chunk_id: string }) => row.chunk_id;
  trackByIndexId = (_: number, row: { index_id: string }) => row.index_id;
  trackByTocId = (_: number, row: { toc_id: string }) => row.toc_id;

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

      await this.loadTermRows();
      await this.loadAllTocRows();
      await this.loadCurrentList(false);

      const tocId = this.initialTocId;
      const chunkId = this.initialChunkId;
      if (tocId) {
        await this.openChunkByToc(tocId, false);
      } else if (chunkId) {
        await this.openChunkById(chunkId, false);
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

  private async loadSearchRows(moveToResultsTab: boolean): Promise<void> {
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

      this.searchTotal = res.total ?? 0;
      this.searchRows = (res.results ?? []).map((row: BookSearchChunkHit) => ({
        chunk_id: row.chunk_id,
        page_no: row.page_no,
        heading_raw: row.heading_raw,
        snippet_html: this.snippetHtml(row.hit),
      }));
    } catch (err: unknown) {
      this.searchRows = [];
      this.searchTotal = 0;
      this.searchError = err instanceof Error ? err.message : 'Search failed.';
    } finally {
      this.searchLoading = false;
      if (moveToResultsTab && this.isCompact) {
        this.mobileTab = 'books';
      }
    }
  }

  private async loadReadRows(moveToResultsTab: boolean): Promise<void> {
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

      if (this.readTab === 'pages') {
        const res = await firstValueFrom(
          this.bookSearch.listPages({
            source_code: this.selectedSourceCode,
            page_from: this.pageFrom ?? undefined,
            page_to: this.pageTo ?? undefined,
            heading_norm: this.headingFilter.trim() || undefined,
            limit: 5000,
            offset: 0,
          })
        );

        this.readRows = res.results ?? [];
        this.indexRows = [];
        this.tocRows = [];
        this.readTotal = res.total ?? this.readRows.length;
      } else if (this.readTab === 'index') {
        const res = await firstValueFrom(
          this.bookSearch.listIndex({
            source_code: this.selectedSourceCode,
            heading_norm: this.headingFilter.trim() || undefined,
            page_from: this.pageFrom ?? undefined,
            page_to: this.pageTo ?? undefined,
            limit: 5000,
            offset: 0,
          })
        );

        this.readRows = [];
        this.indexRows = res.results ?? [];
        this.tocRows = [];
        this.readTotal = res.total ?? this.indexRows.length;
      } else {
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

        this.readRows = [];
        this.indexRows = [];
        this.tocRows = this.sortTocRows(res.results ?? []);
        this.readTotal = res.total ?? this.tocRows.length;
      }
    } catch (err: unknown) {
      this.readRows = [];
      this.indexRows = [];
      this.tocRows = [];
      this.readTotal = 0;
      this.readError = err instanceof Error ? err.message : 'Failed to load entries.';
    } finally {
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
      const res = await firstValueFrom(
        this.bookSearch.listToc({
          source_code: this.selectedSourceCode,
          limit: 5000,
          offset: 0,
        })
      );
      this.allTocRows = this.sortTocRows(res.results ?? []);
    } catch {
      this.allTocRows = [];
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

  private async openChunkByToc(tocId: string, moveToReaderTab: boolean): Promise<void> {
    if (!tocId) return;
    this.readerLoading = true;
    this.readerError = '';

    try {
      const res = await firstValueFrom(this.bookSearch.getReaderChunk({ toc_id: tocId }));
      await this.applyReaderPayload(res, 'Unable to render this TOC entry.', moveToReaderTab);
    } catch (err: unknown) {
      this.readerError = err instanceof Error ? err.message : 'Unable to open TOC section.';
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
      await this.loadTermRows();
      await this.loadAllTocRows();
      await this.loadCurrentList(false);
    }

    this.selectedChunk = res.chunk;
    this.readerNav = this.normalizeReaderNav(res.nav);
    this.activeChunkId = this.isReaderChunkToc(res.chunk) ? '' : res.chunk.chunk_id;
    this.activeTocId = this.isReaderChunkToc(res.chunk)
      ? (res.chunk.toc_id ?? '')
      : this.activeTocIdForPage(res.chunk.page_no);
    this.jumpPageNo = res.chunk.page_no;

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

  private sortTocRows(rows: BookSearchTocRow[]): BookSearchTocRow[] {
    return [...rows].sort((a, b) => {
      const pageA = a.page_no ?? Number.MAX_SAFE_INTEGER;
      const pageB = b.page_no ?? Number.MAX_SAFE_INTEGER;
      if (pageA !== pageB) return pageA - pageB;
      if (a.depth !== b.depth) return a.depth - b.depth;
      const pathA = a.index_path ?? '';
      const pathB = b.index_path ?? '';
      const pathCmp = pathA.localeCompare(pathB);
      if (pathCmp !== 0) return pathCmp;
      return a.toc_id.localeCompare(b.toc_id);
    });
  }

  private activeTocIdForPage(pageNo: number | null): string {
    if (pageNo === null) return '';
    const eligible = this.allTocRows.filter((row) => row.page_no !== null && row.page_no <= pageNo);
    if (!eligible.length) return '';
    return eligible[eligible.length - 1].toc_id;
  }

  private applyQueryParams(): void {
    const qp = this.route.snapshot.queryParamMap;

    const sourceCode = (qp.get('source_code') ?? '').trim();
    if (sourceCode) {
      this.selectedSourceCode = sourceCode;
    }

    const readTab = (qp.get('read_tab') ?? '').trim().toLowerCase();
    if (readTab === 'pages' || readTab === 'index' || readTab === 'toc') {
      this.readTab = readTab;
    }

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
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        source_code: this.selectedSourceCode || null,
        view_mode: 'read',
        read_tab: this.readTab,
        q: this.query.trim() || null,
        page_from: this.pageFrom ?? null,
        page_to: this.pageTo ?? null,
        heading: this.headingFilter.trim() || null,
        jump_page: this.jumpPageNo ?? null,
        chunk_id: this.selectedChunk && !this.isTocReader ? this.selectedChunk.chunk_id : null,
        toc_id: this.isTocReader ? ((this.selectedChunk?.toc_id ?? this.activeTocId) || null) : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

    if (this.selectedChunk) {
      this.mobileTab = 'reader';
      return;
    }

    this.mobileTab = 'books';
  }

  private clearReaderSelection(): void {
    this.selectedChunk = null;
    this.activeChunkId = '';
    this.activeTocId = '';
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
