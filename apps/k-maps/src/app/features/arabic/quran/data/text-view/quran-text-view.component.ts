import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppHeaderbarComponent } from '../../../../../shared/components';
import { QuranDataService } from '../../../../../shared/services/quran-data.service';
import { QuranAyah, QuranAyahWord, QuranSurah } from '../../../../../shared/models/arabic/quran-data.model';

type QuranAyahWithPage = QuranAyah & { page?: number | null };
type ReadingToken = { text: string; type: 'word' | 'mark' };
type ReadingPage = { page: number | null; tokens: ReadingToken[] };

@Component({
  selector: 'app-quran-text-view',
  standalone: true,
  imports: [CommonModule, AppHeaderbarComponent],
  templateUrl: './quran-text-view.component.html',
  styleUrls: ['./quran-text-view.component.scss'],
})
export class QuranTextViewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(QuranDataService);
  private readonly subs = new Subscription();

  readonly bismillah = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  readonly bismillahTranslation = 'In the Name of Allah—the Most Compassionate, Most Merciful';

  surahId: number | null = null;
  surah: QuranSurah | null = null;
  ayahs: QuranAyahWithPage[] = [];
  viewMode: 'verse' | 'reading' = 'verse';
  lemmaTokensByAyah = new Map<number, string[]>();
  lemmaTokensLoaded = false;
  loadingLemmaTokens = false;
  lemmaTokensError = '';
  readingPages: ReadingPage[] = [];
  readingText = '';

  loadingSurah = false;
  loadingAyahs = false;
  error = '';

  ngOnInit() {
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const raw = params.get('surah');
        const id = Number.parseInt(String(raw ?? ''), 10);
        if (!Number.isFinite(id) || id < 1 || id > 114) {
          this.error = 'Invalid surah id.';
          this.surah = null;
          this.ayahs = [];
          return;
        }
        this.surahId = id;
        void this.loadSurah(id);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async loadSurah(id: number) {
    this.loadingSurah = true;
    this.error = '';
    try {
      await this.loadAyahs(id);
      this.lemmaTokensByAyah.clear();
      this.lemmaTokensLoaded = false;
      this.lemmaTokensError = '';
    } catch (err: any) {
      console.error('surah load error', err);
      this.error = err?.message ?? 'Unable to load surah.';
    } finally {
      this.loadingSurah = false;
    }
  }

  async loadAyahs(surah: number) {
    this.loadingAyahs = true;
    this.ayahs = [];
    try {
      const response = await this.dataService.listAyahs({ surah, pageSize: 400 });
      this.surah = response.surah ?? this.surah;
      this.ayahs = response.verses ?? response.results ?? [];
      this.hydrateLemmaTokensFromAyahs();
      if (this.viewMode === 'reading' && this.lemmaTokensLoaded) {
        this.buildReadingPages();
      }
    } catch (err: any) {
      console.error('ayah load error', err);
      this.error = err?.message ?? 'Unable to load ayahs.';
    } finally {
      this.loadingAyahs = false;
    }
  }

  hydrateLemmaTokensFromAyahs() {
    this.lemmaTokensByAyah.clear();
    let hasLemmaData = false;
    for (const ayah of this.ayahs) {
      const wordRows = Array.isArray(ayah.words) ? ayah.words : [];
      const lemmas = Array.isArray(ayah.lemmas) ? ayah.lemmas : [];
      const source = wordRows.length ? wordRows : lemmas;
      if (!source.length) continue;
      hasLemmaData = true;
      const tokens = source
        .map((lemma) =>
          'text_uthmani' in lemma || 'text_imlaei_simple' in lemma
            ? (lemma as QuranAyahWord).text_uthmani ||
              (lemma as QuranAyahWord).word_diacritic ||
              (lemma as QuranAyahWord).text_imlaei_simple ||
              (lemma as QuranAyahWord).word_simple ||
              ''
            : (lemma as any).word_diacritic || (lemma as any).word_simple || ''
        )
        .filter(Boolean);
      if (tokens.length) {
        this.lemmaTokensByAyah.set(ayah.ayah, tokens);
      }
    }
    this.lemmaTokensLoaded = hasLemmaData;
  }

  get shouldShowBismillah() {
    return !!this.surah && this.surah.surah !== 9;
  }

  get headerTitle() {
    if (!this.surah) return 'Quran Text';
    const englishName = this.surah.name_en || `Surah ${this.surah.surah}`;
    return `${this.surah.surah}. ${englishName}`;
  }

  setViewMode(mode: 'verse' | 'reading') {
    this.viewMode = mode;
    if (mode === 'reading' && this.surahId && !this.lemmaTokensLoaded && !this.loadingLemmaTokens) {
      void this.loadLemmaTokens(this.surahId);
    } else if (mode === 'reading') {
      this.buildReadingPages();
    }
  }

  goBack() {
    this.router.navigate(['/arabic/quran/data/text']);
  }

  trackByAyah = (_: number, ayah: QuranAyahWithPage) => `${ayah.surah}:${ayah.ayah}`;
  trackByAyahWord = (_: number, word: QuranAyahWord) =>
    word.word_location || word.location || word.id || word.lemma_id || word.token_index || word.position || _;

  showPageDivider(index: number) {
    if (index <= 0) return false;
    const currentPage = this.ayahs[index]?.page ?? null;
    const previousPage = this.ayahs[index - 1]?.page ?? null;
    if (!currentPage) return false;
    return currentPage !== previousPage;
  }

  getAyahMark(ayah: QuranAyahWithPage) {
    return ayah.verse_mark || `(${ayah.ayah})`;
  }

  getWordText(word: QuranAyahWord) {
    return (
      word.text_uthmani ||
      word.word_diacritic ||
      word.text_imlaei_simple ||
      word.word_simple ||
      ''
    );
  }

  splitAyahWords(text: string) {
    return String(text ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  async loadLemmaTokens(surah: number) {
    this.loadingLemmaTokens = true;
    this.lemmaTokensError = '';
    this.lemmaTokensByAyah.clear();
    this.readingPages = [];

    let page = 1;
    let hasMore = true;
    try {
      while (hasMore) {
        const response = await this.dataService.listLemmaLocations({ surah, page, pageSize: 200 });
        const rows = response.results ?? [];
        for (const row of rows) {
          const ayah = row.ayah;
          if (!ayah) continue;
          const word = row.word_diacritic || row.word_simple || '';
          if (!word) continue;
          if (!this.lemmaTokensByAyah.has(ayah)) {
            this.lemmaTokensByAyah.set(ayah, []);
          }
          this.lemmaTokensByAyah.get(ayah)?.push(word);
        }
        hasMore = !!response.hasMore;
        page += 1;
      }
      this.lemmaTokensLoaded = true;
      this.buildReadingPages();
    } catch (err: any) {
      console.error('lemma token load error', err);
      this.lemmaTokensError = err?.message ?? 'Unable to load lemma tokens.';
    } finally {
      this.loadingLemmaTokens = false;
    }
  }

  getReadingTokens(ayah: QuranAyahWithPage): string[] {
    const tokens = this.lemmaTokensByAyah.get(ayah.ayah);
    if (tokens && tokens.length) return tokens;
    return this.splitAyahWords(ayah.text_uthmani || ayah.text || '');
  }

  buildReadingPages() {
    const pages: ReadingPage[] = [];
    const pageMap = new Map<number, ReadingPage>();
    const tokens: string[] = [];

    for (const ayah of this.ayahs) {
      const pageKey = ayah.page ?? 0;
      let page = pageMap.get(pageKey);
      if (!page) {
        page = { page: ayah.page ?? null, tokens: [] };
        pageMap.set(pageKey, page);
        pages.push(page);
      }

      const words = this.getReadingTokens(ayah);
      for (const word of words) {
        page.tokens.push({ text: word, type: 'word' });
        tokens.push(word);
      }
      const marker = this.getAyahMark(ayah);
      if (marker) {
        page.tokens.push({ text: marker, type: 'mark' });
        tokens.push(marker);
      }
    }

    this.readingPages = pages;
    this.readingText = tokens.join(' ').replace(/\s+/g, ' ').trim();
  }
}
