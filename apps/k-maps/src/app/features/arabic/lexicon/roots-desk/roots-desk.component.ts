import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';

import { AppCrudTableComponent, CrudTableColumn } from '../../../../shared/components';
import {
  BookSearchService,
  BookSearchSource,
  BookSearchChunkHit,
  BookSearchEvidenceHit,
  BookSearchLexiconEvidence,
} from '../../../../shared/services/book-search.service';

type LexiconTab = 'semantic' | 'derivatives' | 'quran' | 'philology' | 'theology';
type LexiconSubMenu = 'evidence' | 'entries' | 'surah';
type ChunkTypeFilter = 'all' | 'grammar' | 'literature' | 'lexicon' | 'reference' | 'other';

type LexiconEntryRow = {
  ar_u_lexicon: string;
  evidence_count: number;
  source_codes: string;
  surahs: string;
  sample_extract: string;
};

type SurahLexiconRow = {
  surah_label: string;
  ar_u_lexicon: string;
  evidence_count: number;
  source_codes: string;
  sample_extract: string;
};

@Component({
  selector: 'app-roots-desk',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCrudTableComponent],
  templateUrl: './roots-desk.component.html',
  styleUrls: ['./roots-desk.component.scss'],
})
export class RootsDeskComponent implements OnInit, OnDestroy {
  readonly tabs: { id: LexiconTab; label: string }[] = [
    { id: 'semantic', label: 'Semantic Field' },
    { id: 'derivatives', label: 'Derivatives' },
    { id: 'quran', label: 'Qur’anic Usage' },
    { id: 'philology', label: 'Philological Debate' },
    { id: 'theology', label: 'Theological Implications' },
  ];
  readonly subMenuCards: { id: LexiconSubMenu; title: string; description: string }[] = [
    {
      id: 'evidence',
      title: 'Evidence',
      description: 'Search evidence snippets and notes linked to lexicon entries.',
    },
    {
      id: 'entries',
      title: 'ar_u_lexicon',
      description: 'List all lexicon IDs found in evidence for the selected source.',
    },
    {
      id: 'surah',
      title: 'Surah + Lexicon',
      description: 'Show lexicon IDs and evidence counts grouped per surah.',
    },
  ];

  activeTab: LexiconTab = 'semantic';
  activeSubMenu: LexiconSubMenu = 'evidence';
  entryArabic = 'مبين';
  entryTitle = 'Lexicon Entry';
  entryGloss = 'Clear, distinct, evident';

  sourceQuery = '';
  sourcesLoading = false;
  sourcesError = '';
  sources: BookSearchSource[] = [];
  selectedSourceCode = '';

  chunkQuery = 'mubin OR مبين';
  chunkTypeFilter: ChunkTypeFilter = 'lexicon';
  readonly chunkTypeOptions: { value: ChunkTypeFilter; label: string }[] = [
    { value: 'all', label: 'All types' },
    { value: 'lexicon', label: 'Lexicon' },
    { value: 'grammar', label: 'Grammar' },
    { value: 'literature', label: 'Literature' },
    { value: 'reference', label: 'Reference' },
    { value: 'other', label: 'Other' },
  ];
  pageFrom: number | null = 150;
  pageTo: number | null = 220;
  headingNorm = '';
  chunksLoading = false;
  chunksError = '';
  chunksTotal = 0;
  chunkResults: BookSearchChunkHit[] = [];

  evidenceQuery = 'clear OR mubin OR مبين';
  evidenceLoading = false;
  evidenceError = '';
  evidenceTotal = 0;
  evidenceResults: BookSearchEvidenceHit[] = [];

  entriesLoading = false;
  entriesError = '';
  entriesTotal = 0;
  entryRows: LexiconEntryRow[] = [];
  readonly entryColumns: CrudTableColumn[] = [
    { key: 'ar_u_lexicon', label: 'ar_u_lexicon' },
    { key: 'evidence_count', label: 'Evidence' },
    { key: 'surahs', label: 'Surahs' },
    { key: 'source_codes', label: 'Sources' },
    { key: 'sample_extract', label: 'Sample Extract' },
  ];

  surahLoading = false;
  surahError = '';
  surahTotal = 0;
  surahRows: SurahLexiconRow[] = [];
  readonly surahColumns: CrudTableColumn[] = [
    { key: 'surah_label', label: 'Surah' },
    { key: 'ar_u_lexicon', label: 'ar_u_lexicon' },
    { key: 'evidence_count', label: 'Evidence' },
    { key: 'source_codes', label: 'Sources' },
    { key: 'sample_extract', label: 'Sample Extract' },
  ];

  lexiconId = '';
  lexiconEvidenceLoading = false;
  lexiconEvidenceError = '';
  lexiconEvidenceTotal = 0;
  lexiconEvidenceResults: BookSearchLexiconEvidence[] = [];
  readonly lexiconEvidenceColumns: CrudTableColumn[] = [
    { key: 'source_code', label: 'Source' },
    { key: 'page_no', label: 'Page' },
    { key: 'extract_text', label: 'Extract' },
    { key: 'notes', label: 'Notes' },
  ];

  private readonly subscriptions = new Subscription();

  constructor(private readonly bookSearch: BookSearchService) {}

  ngOnInit(): void {
    this.loadSources();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get selectedSource(): BookSearchSource | null {
    return this.sources.find((s) => s.source_code === this.selectedSourceCode) ?? null;
  }

  setTab(tab: LexiconTab): void {
    this.activeTab = tab;
  }

  setSubMenu(menu: LexiconSubMenu): void {
    this.activeSubMenu = menu;
    if (menu !== 'evidence') {
      this.refreshDerivedViews();
    }
  }

  loadSources(): void {
    this.sourcesLoading = true;
    this.sourcesError = '';

    const q = this.sourceQuery.trim();
    const sub = this.bookSearch
      .listSources({
        q: q || undefined,
        limit: 100,
        offset: 0,
      })
      .subscribe({
        next: (res) => {
          this.sources = res.results ?? [];
          if (this.selectedSourceCode && !this.sources.find((s) => s.source_code === this.selectedSourceCode)) {
            this.selectedSourceCode = '';
          }
          this.runChunkSearch();
          this.runEvidenceSearch();
          this.sourcesLoading = false;
        },
        error: (err) => {
          this.sourcesLoading = false;
          this.sourcesError = err instanceof Error ? err.message : 'Failed to load sources.';
        },
      });

    this.subscriptions.add(sub);
  }

  selectSource(sourceCode: string): void {
    this.selectedSourceCode = sourceCode;
    this.resetDerivedViews();
    this.runChunkSearch();
    this.runEvidenceSearch();
    if (this.lexiconId.trim()) {
      this.runLexiconEvidence();
    }
    if (this.activeSubMenu !== 'evidence') {
      this.refreshDerivedViews();
    }
  }

  runChunkSearch(): void {
    this.chunksLoading = true;
    this.chunksError = '';

    const sub = this.bookSearch
      .searchChunks({
        source_code: this.selectedSourceCode || undefined,
        q: this.chunkQuery.trim() || undefined,
        chunk_type: this.chunkTypeFilter === 'all' ? undefined : this.chunkTypeFilter,
        page_from: this.pageFrom ?? undefined,
        page_to: this.pageTo ?? undefined,
        heading_norm: this.headingNorm.trim() || undefined,
        limit: 80,
        offset: 0,
      })
      .subscribe({
        next: (res) => {
          this.chunkResults = res.results ?? [];
          this.chunksTotal = res.total ?? this.chunkResults.length;
          this.chunksLoading = false;
        },
        error: (err) => {
          this.chunksLoading = false;
          this.chunksError = err instanceof Error ? err.message : 'Book search failed.';
        },
      });

    this.subscriptions.add(sub);
  }

  runEvidenceSearch(): void {
    this.evidenceLoading = true;
    this.evidenceError = '';

    const sub = this.bookSearch
      .searchEvidence({
        source_code: this.selectedSourceCode || undefined,
        q: this.evidenceQuery.trim() || undefined,
        limit: 60,
        offset: 0,
      })
      .subscribe({
        next: (res) => {
          this.evidenceResults = res.results ?? [];
          this.evidenceTotal = res.total ?? this.evidenceResults.length;
          this.evidenceLoading = false;
        },
        error: (err) => {
          this.evidenceLoading = false;
          this.evidenceError = err instanceof Error ? err.message : 'Evidence search failed.';
        },
      });

    this.subscriptions.add(sub);
  }

  runLexiconEvidence(): void {
    const lexicon = this.lexiconId.trim();
    if (!lexicon) {
      this.lexiconEvidenceResults = [];
      this.lexiconEvidenceTotal = 0;
      this.lexiconEvidenceError = 'Enter ar_u_lexicon id to load grouped evidence.';
      return;
    }

    this.lexiconEvidenceLoading = true;
    this.lexiconEvidenceError = '';

    const sub = this.bookSearch
      .listLexiconEvidence({
        ar_u_lexicon: lexicon,
        source_code: this.selectedSourceCode || undefined,
        limit: 120,
        offset: 0,
      })
      .subscribe({
        next: (res) => {
          this.lexiconEvidenceResults = res.results ?? [];
          this.lexiconEvidenceTotal = res.total ?? this.lexiconEvidenceResults.length;
          this.lexiconEvidenceLoading = false;
        },
        error: (err) => {
          this.lexiconEvidenceLoading = false;
          this.lexiconEvidenceError = err instanceof Error ? err.message : 'Lexicon evidence lookup failed.';
        },
      });

    this.subscriptions.add(sub);
  }

  clearHeadingFilter(): void {
    this.headingNorm = '';
    this.runChunkSearch();
  }

  refreshDerivedViews(): void {
    this.entriesLoading = true;
    this.surahLoading = true;
    this.entriesError = '';
    this.surahError = '';

    this.fetchEvidenceUniverse()
      .then((rows) => {
        this.entryRows = this.buildEntryRows(rows);
        this.entriesTotal = this.entryRows.length;
        this.surahRows = this.buildSurahRows(rows);
        this.surahTotal = this.surahRows.length;
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load derived lexicon views.';
        this.entriesError = message;
        this.surahError = message;
        this.entryRows = [];
        this.surahRows = [];
        this.entriesTotal = 0;
        this.surahTotal = 0;
      })
      .finally(() => {
        this.entriesLoading = false;
        this.surahLoading = false;
      });
  }

  private resetDerivedViews(): void {
    this.entryRows = [];
    this.surahRows = [];
    this.entriesTotal = 0;
    this.surahTotal = 0;
    this.entriesError = '';
    this.surahError = '';
  }

  private async fetchEvidenceUniverse(): Promise<BookSearchEvidenceHit[]> {
    const all: BookSearchEvidenceHit[] = [];
    let offset = 0;
    const limit = 200;
    let total = Number.POSITIVE_INFINITY;
    const q = this.evidenceQuery.trim() || undefined;
    const hardCap = 5000;

    while (offset < total && all.length < hardCap) {
      const res = await firstValueFrom(
        this.bookSearch.searchEvidence({
          source_code: this.selectedSourceCode || undefined,
          q,
          limit,
          offset,
        })
      );

      const rows = res.results ?? [];
      total = Number(res.total ?? rows.length);
      all.push(...rows);
      offset += rows.length;

      if (!rows.length) break;
    }

    return all;
  }

  private buildEntryRows(rows: BookSearchEvidenceHit[]): LexiconEntryRow[] {
    const map = new Map<
      string,
      {
        count: number;
        surahs: Set<number>;
        sources: Set<string>;
        sample: string;
      }
    >();

    for (const row of rows) {
      const key = row.ar_u_lexicon || 'unknown';
      const found = map.get(key) ?? {
        count: 0,
        surahs: new Set<number>(),
        sources: new Set<string>(),
        sample: '',
      };

      found.count += 1;
      if (row.source_code) found.sources.add(row.source_code);
      for (const surah of this.extractSurahNumbers(row)) {
        found.surahs.add(surah);
      }
      if (!found.sample) {
        found.sample = this.stripHit(row.extract_hit) || this.stripHit(row.notes_hit);
      }
      map.set(key, found);
    }

    return Array.from(map.entries())
      .map(([ar_u_lexicon, value]) => ({
        ar_u_lexicon,
        evidence_count: value.count,
        source_codes: Array.from(value.sources).sort().join(', '),
        surahs: this.formatSurahSet(value.surahs),
        sample_extract: value.sample || '—',
      }))
      .sort((a, b) => b.evidence_count - a.evidence_count || a.ar_u_lexicon.localeCompare(b.ar_u_lexicon));
  }

  private buildSurahRows(rows: BookSearchEvidenceHit[]): SurahLexiconRow[] {
    const map = new Map<
      string,
      {
        surah: number | null;
        ar_u_lexicon: string;
        count: number;
        sources: Set<string>;
        sample: string;
      }
    >();

    for (const row of rows) {
      const surahs = this.extractSurahNumbers(row);
      const resolved = surahs.length ? surahs : [null];
      for (const surah of resolved) {
        const lexicon = row.ar_u_lexicon || 'unknown';
        const key = `${surah === null ? 'unknown' : surah}|${lexicon}`;
        const found = map.get(key) ?? {
          surah,
          ar_u_lexicon: lexicon,
          count: 0,
          sources: new Set<string>(),
          sample: '',
        };
        found.count += 1;
        if (row.source_code) found.sources.add(row.source_code);
        if (!found.sample) {
          found.sample = this.stripHit(row.extract_hit) || this.stripHit(row.notes_hit);
        }
        map.set(key, found);
      }
    }

    return Array.from(map.values())
      .map((row) => ({
        surah_label: row.surah === null ? 'Unknown' : `S${String(row.surah).padStart(3, '0')}`,
        ar_u_lexicon: row.ar_u_lexicon,
        evidence_count: row.count,
        source_codes: Array.from(row.sources).sort().join(', '),
        sample_extract: row.sample || '—',
      }))
      .sort((a, b) => {
        const sa = a.surah_label === 'Unknown' ? 999 : Number(a.surah_label.slice(1));
        const sb = b.surah_label === 'Unknown' ? 999 : Number(b.surah_label.slice(1));
        return sa - sb || b.evidence_count - a.evidence_count || a.ar_u_lexicon.localeCompare(b.ar_u_lexicon);
      });
  }

  private extractSurahNumbers(row: BookSearchEvidenceHit): number[] {
    const haystack = [
      this.stripHit(row.extract_hit),
      this.stripHit(row.notes_hit),
      row.chunk_id ?? '',
      row.source_code ?? '',
    ].join(' ');

    const found = new Set<number>();

    const refRegex = /\b(\d{1,3}):\d{1,3}\b/g;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refRegex.exec(haystack)) !== null) {
      const surah = Number(refMatch[1]);
      if (surah >= 1 && surah <= 114) {
        found.add(surah);
      }
    }

    const surahRegex = /\bsurah[\s:_-]*(\d{1,3})\b/gi;
    let surahMatch: RegExpExecArray | null;
    while ((surahMatch = surahRegex.exec(haystack)) !== null) {
      const surah = Number(surahMatch[1]);
      if (surah >= 1 && surah <= 114) {
        found.add(surah);
      }
    }

    return Array.from(found).sort((a, b) => a - b);
  }

  private formatSurahSet(values: Set<number>): string {
    const sorted = Array.from(values).sort((a, b) => a - b);
    if (!sorted.length) return 'Unknown';
    return sorted.map((v) => `S${String(v).padStart(3, '0')}`).join(', ');
  }

  sourceCountLabel(): string {
    const count = this.sources.length;
    if (count === 1) return '1 source';
    return `${count} sources`;
  }

  selectedSourceLabel(): string {
    if (!this.selectedSourceCode) return 'ALL SOURCES';
    return this.selectedSourceCode;
  }

  stripHit(value: string | null | undefined): string {
    return String(value ?? '').replace(/\[/g, '').replace(/\]/g, '').trim();
  }
}
