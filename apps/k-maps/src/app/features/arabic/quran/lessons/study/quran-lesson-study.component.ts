import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  AppFontSizeControlsComponent,
  AppPillsComponent,
  type AppPillItem,
  AppTabsComponent,
  type AppTabItem,
} from '../../../../../shared/components';
import { QuranAyah } from '../../../../../shared/models/arabic/quran-data.model';
import { PageHeaderTabsConfig } from '../../../../../shared/models/core/page-header.model';
import { PageHeaderService } from '../../../../../shared/services/page-header.service';
import { QuranWordInspectorComponent, type QuranWordInspectorSelection } from '../../shared';
import { QuranLessonEditorFacade } from '../edit-new/facade/editor.facade';
import { EditorState, SentenceSubTab, TaskTab, TaskType } from '../edit-new/models/editor.types';
import { selectSelectedAyahs, selectSelectedRangeLabelShort } from '../edit-new/state/editor.selectors';

const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

const LEGACY_STUDY_TAB_MAP: Record<string, TaskType> = {
  study: 'reading',
  reading: 'reading',
  memory: 'sentence_structure',
  sentences: 'sentence_structure',
  mcq: 'comprehension',
  passage: 'passage_structure',
};

const STUDY_TASK_TAB_ORDER: Array<'lesson' | TaskType> = [
  'lesson',
  'reading',
  'morphology',
  'sentence_structure',
  'grammar_concepts',
  'expressions',
  'comprehension',
  'passage_structure',
];

const SENTENCE_SUB_TABS: AppTabItem[] = [
  { id: 'verses', label: 'Verses' },
  { id: 'items', label: 'Items' },
  { id: 'json', label: 'JSON' },
];

type ReadingWordToken = {
  text: string;
  location: string;
  surah: number;
  ayah: number;
  tokenIndex: number;
};

@Component({
  selector: 'app-quran-lesson-study',
  standalone: true,
  imports: [CommonModule, AppTabsComponent, AppPillsComponent, AppFontSizeControlsComponent, QuranWordInspectorComponent],
  templateUrl: './quran-lesson-study.component.html',
  styleUrls: ['./quran-lesson-study.component.scss'],
  providers: [QuranLessonEditorFacade],
})
export class QuranLessonStudyComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(QuranLessonEditorFacade);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly subs = new Subscription();

  private facadeReady = false;
  private fontRem = 1.35;
  private readonly minFontRem = 1;
  private readonly maxFontRem = 9.6;

  ready = false;
  studyActiveTaskTab: 'lesson' | TaskType = 'lesson';
  selectedReadingWord: QuranWordInspectorSelection | null = null;
  morphologyDialogWord: QuranWordInspectorSelection | null = null;

  get state(): EditorState {
    return this.facade.state;
  }

  get lessonTitle() {
    return this.state.lessonTitleEn || (this.state.lessonId ? `Lesson #${this.state.lessonId}` : 'Quran Lesson');
  }

  get lessonSubtitle() {
    const surah = this.state.selectedSurah;
    const start = this.state.rangeStart;
    const end = this.state.rangeEnd ?? start;

    if (!surah || start == null || end == null) {
      return 'Reference not available yet.';
    }

    return start === end
      ? `Surah ${surah}, Ayah ${start}`
      : `Surah ${surah}, Ayah ${start}-${end}`;
  }

  get activeTaskTab(): TaskTab | null {
    if (this.studyActiveTaskTab === 'lesson') return null;
    return this.state.taskTabs.find((tab) => tab.type === this.studyActiveTaskTab) ?? null;
  }

  get sentenceTabs(): AppTabItem[] {
    return SENTENCE_SUB_TABS;
  }

  get sentencePrimaryIds(): string[] {
    return SENTENCE_SUB_TABS.map((tab) => tab.id);
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.state);
  }

  get sentenceAyahsForStudy() {
    const selected = new Set(this.state.sentenceAyahSelections);
    if (!selected.size) return this.selectedAyahs;
    return this.selectedAyahs.filter((ayah) => selected.has(ayah.ayah));
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.state);
  }

  get arabicFontSize(): string {
    return `${this.fontRem.toFixed(2)}rem`;
  }

  get readingTextNonDiacritic(): string {
    return this.getReadingSourceAyahs()
      .map((ayah) => this.resolveReadingAyahText(ayah))
      .filter((text) => Boolean(text))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  get readingAyahWordGroups(): Array<{ ayah: number; words: ReadingWordToken[] }> {
    return this.getReadingSourceAyahs()
      .map((ayah) => {
        const words = this.splitWords(this.resolveReadingAyahText(ayah)).map((word, index) => ({
          text: word,
          location: `${ayah.surah}:${ayah.ayah}:${index + 1}`,
          surah: ayah.surah,
          ayah: ayah.ayah,
          tokenIndex: index + 1,
        }));
        return { ayah: ayah.ayah, words };
      })
      .filter((group) => group.words.length > 0);
  }

  get readingTaskPayload(): Record<string, unknown> {
    const readingTask = this.state.taskTabs.find((entry) => entry.type === 'reading');
    return this.parseTaskJsonObject(readingTask?.json ?? '');
  }

  get morphologyTaskPayload(): Record<string, unknown> {
    const morphologyTask = this.state.taskTabs.find((entry) => entry.type === 'morphology');
    return this.parseTaskJsonObject(morphologyTask?.json ?? '');
  }

  get lexiconMorphologyItems(): Array<Record<string, unknown>> {
    const payload = this.morphologyTaskPayload;
    return this.objectArray(payload['lexicon_morphology']);
  }

  get morphologyEvidenceItems(): Array<Record<string, unknown>> {
    const payload = this.morphologyTaskPayload;
    return this.objectArray(payload['lexicon_evidence']);
  }

  get morphologyItems(): Array<Record<string, unknown>> {
    const payload = this.morphologyTaskPayload;
    const fromItems = this.objectArray(payload['items']);
    if (fromItems.length) return fromItems;
    return this.lexiconMorphologyItems;
  }

  get nounMorphologyItems(): Array<Record<string, unknown>> {
    return this.morphologyItems.filter((item) => this.morphologyPos(item) === 'noun');
  }

  get verbMorphologyItems(): Array<Record<string, unknown>> {
    return this.morphologyItems.filter((item) => this.morphologyPos(item) === 'verb');
  }

  get nounMorphologyPills(): AppPillItem[] {
    return this.toMorphologyPills(this.nounMorphologyItems, 'noun');
  }

  get verbMorphologyPills(): AppPillItem[] {
    return this.toMorphologyPills(this.verbMorphologyItems, 'verb');
  }

  get lessonHeading(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['heading', 'title', 'study_heading', 'lesson_heading']) || this.lessonTitle;
  }

  get lessonDetail(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['detail', 'description', 'summary', 'overview']) || 'No lesson detail available yet.';
  }

  get episodeIntro(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['episode_intro', 'episodeIntro', 'intro']) || 'Not provided';
  }

  get sceneDetail(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['scene', 'scene_intro', 'scene_detail']) || 'Not provided';
  }

  get sceneAesthetic(): string {
    const payload = this.getPassageStructurePayload();
    return this.pickFirst(payload, ['scene_aesthetic', 'aesthetic', 'style', 'tone']) || 'Not provided';
  }

  get sentenceItems(): Array<Record<string, unknown>> {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab?.json?.trim()) return [];
    try {
      const parsed = JSON.parse(tab.json) as Record<string, unknown>;
      const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
      return items.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  get sentenceTaskJson(): string {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    return this.formatJson(tab?.json ?? '');
  }

  ngOnInit() {
    const stored = this.readStoredFontSize();
    if (stored != null) {
      this.fontRem = stored;
    }

    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        if (!this.facadeReady) return;
        this.applyRouteParams(params);
      })
    );

    void this.facade
      .init()
      .then(() => {
        this.facadeReady = true;
        this.applyRouteParams(this.route.snapshot.queryParamMap);
        this.syncPageHeaderTabs();
      })
      .catch(() => {
        // state.statusMessage is set by facade
      })
      .finally(() => {
        this.ready = true;
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageHeader.clearTabs();
    this.facade.destroy();
  }

  onSentenceTabChange(tab: AppTabItem) {
    const sub = tab.id as SentenceSubTab;
    if (!this.isSentenceSubTab(sub)) return;
    this.facade.selectSentenceSubTab(sub, false);
    this.syncQueryParams({ sub });
  }

  selectReadingWord(token: ReadingWordToken) {
    const location = token.location.trim();
    if (!location) return;
    if (this.selectedReadingWord?.location === location) {
      this.selectedReadingWord = null;
      return;
    }
    this.selectedReadingWord = {
      text: token.text,
      location,
      surah: token.surah,
      ayah: token.ayah,
      tokenIndex: token.tokenIndex,
    };
  }

  onReadingWordKeydown(event: KeyboardEvent, token: ReadingWordToken) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.selectReadingWord(token);
  }

  isReadingWordSelected(location: string): boolean {
    return this.selectedReadingWord?.location === location;
  }

  clearReadingWordSelection() {
    this.selectedReadingWord = null;
  }

  onMorphologyPillSelect(pill: AppPillItem) {
    const item = this.findMorphologyItemByPill(pill);
    if (!item) return;
    const selection = this.buildMorphologySelection(item);
    if (!selection) return;
    this.morphologyDialogWord = selection;
  }

  closeMorphologyWordDialog() {
    this.morphologyDialogWord = null;
  }

  increaseFont() {
    this.fontRem = Math.min(this.fontRem + 0.1, this.maxFontRem);
    this.persistFontSize();
  }

  decreaseFont() {
    this.fontRem = Math.max(this.fontRem - 0.1, this.minFontRem);
    this.persistFontSize();
  }

  resetFont() {
    this.fontRem = 1.35;
    this.persistFontSize();
  }

  valueOf(item: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = item[key];
      if (value == null) continue;
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch {
          return '[object]';
        }
      }
    }
    return '—';
  }

  formatJson(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return 'No task data available.';
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }

  toArabicIndicDigits(value: number): string {
    return String(Math.max(0, Math.trunc(value)))
      .split('')
      .map((ch) => {
        const code = ch.charCodeAt(0) - 48;
        if (code < 0 || code > 9) return ch;
        return ARABIC_INDIC_DIGITS[code];
      })
      .join('');
  }

  morphologyRef(item: Record<string, unknown>): string {
    const location = this.textFromUnknown(item['word_location']);
    if (location) return location;

    const surah = this.numberFromUnknown(item['surah']);
    const ayah = this.numberFromUnknown(item['ayah']);
    const token = this.numberFromUnknown(item['token_index']);
    if (surah != null && ayah != null && token != null) return `${surah}:${ayah}:${token}`;
    if (surah != null && ayah != null) return `${surah}:${ayah}`;
    return '—';
  }

  morphologyWord(item: Record<string, unknown>): string {
    const raw = this.firstText(item, ['surface_ar', 'word', 'text']);
    if (!raw) return '—';
    return this.normalizeMorphologyDisplayText(raw);
  }

  morphologyRoot(item: Record<string, unknown>): string {
    const raw = this.firstText(item, ['root_norm']);
    if (!raw) return '';
    return this.normalizeMorphologyDisplayText(raw);
  }

  private applyRouteParams(params: ParamMap) {
    let task: TaskType | null = null;

    const requestedTask = params.get('task');
    if (requestedTask && this.isTaskType(requestedTask)) {
      task = requestedTask;
    } else {
      const legacyTab = params.get('tab');
      if (legacyTab && LEGACY_STUDY_TAB_MAP[legacyTab]) {
        task = LEGACY_STUDY_TAB_MAP[legacyTab];
      }
    }

    if (task) {
      this.studyActiveTaskTab = task;
      this.facade.selectTaskTab(task, false);
    } else {
      this.studyActiveTaskTab = 'lesson';
    }

    if (this.studyActiveTaskTab !== 'reading') {
      this.clearReadingWordSelection();
    }
    if (this.studyActiveTaskTab !== 'morphology') {
      this.closeMorphologyWordDialog();
    }

    const sub = params.get('sub');
    if (sub && this.isSentenceSubTab(sub)) {
      this.facade.selectSentenceSubTab(sub, false);
    }

    this.syncPageHeaderTabs();
  }

  private syncPageHeaderTabs() {
    const lessonId = this.route.snapshot.paramMap.get('id');
    if (!lessonId) {
      this.pageHeader.clearTabs();
      return;
    }

    const baseCommands = ['/arabic/quran/lessons', lessonId, 'study'];
    const tabs = STUDY_TASK_TAB_ORDER.map((id) => {
      if (id === 'lesson') {
        return {
          id,
          label: 'Lesson',
          commands: baseCommands,
          queryParams: { task: null, sub: null },
        };
      }

      return {
        id,
        label: this.state.taskTabs.find((tab) => tab.type === id)?.label ?? this.toTitle(id),
        commands: baseCommands,
        queryParams: { task: id, sub: id === 'sentence_structure' ? this.state.sentenceSubTab : null },
      };
    });

    const config: PageHeaderTabsConfig = {
      activeTabId: this.studyActiveTaskTab,
      tabs,
      action: {
        label: 'Edit Lesson',
        commands: ['/arabic/quran/lessons', lessonId, 'edit'],
      },
    };

    this.pageHeader.setTabs(config);
  }

  private syncQueryParams(params: Record<string, string | null>) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private isTaskType(value: string): value is TaskType {
    return (
      value === 'reading' ||
      value === 'sentence_structure' ||
      value === 'morphology' ||
      value === 'grammar_concepts' ||
      value === 'expressions' ||
      value === 'comprehension' ||
      value === 'passage_structure'
    );
  }

  private isSentenceSubTab(value: string): value is SentenceSubTab {
    return value === 'verses' || value === 'items' || value === 'json';
  }

  private getPassageStructurePayload(): Record<string, unknown> {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'passage_structure');
    if (!tab?.json?.trim()) return {};
    try {
      const parsed = JSON.parse(tab.json);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private parseTaskJsonObject(raw: string): Record<string, unknown> {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private stripArabicDiacritics(value: string): string {
    return value.replace(ARABIC_DIACRITICS_RE, '').trim();
  }

  private splitWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  private asFiniteNumber(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  private get storageKey(): string {
    const lessonId = this.state.lessonId ?? this.route.snapshot.paramMap.get('id') ?? 'global';
    return `km:quran:study-font:${lessonId}`;
  }

  private readStoredFontSize(): number | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return null;
      if (parsed < this.minFontRem || parsed > this.maxFontRem) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persistFontSize() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.storageKey, String(this.fontRem));
    } catch {
      // localStorage may be unavailable in restricted environments.
    }
  }

  private getReadingSourceAyahs() {
    const payload = this.readingTaskPayload;
    const from = this.asFiniteNumber(payload['ayah_from']);
    const to = this.asFiniteNumber(payload['ayah_to']);
    if (from == null || to == null) {
      return this.selectedAyahs;
    }
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    return this.selectedAyahs.filter((ayah) => ayah.ayah >= min && ayah.ayah <= max);
  }

  private resolveReadingAyahText(ayah: QuranAyah): string {
    const original = (ayah.text_uthmani || ayah.text || '').trim();
    const strippedOriginal = this.stripArabicDiacritics(original);
    const simple = (ayah.text_simple || ayah.text_imlaei_simple || '').trim().replace(/\s+/g, ' ');
    const simpleWords = this.splitWords(simple).length;
    const originalWords = this.splitWords(strippedOriginal).length;

    if (simple && (originalWords <= 1 || simpleWords >= Math.max(2, Math.ceil(originalWords * 0.6)))) {
      return simple;
    }

    return strippedOriginal || simple || original;
  }

  private morphologyPos(item: Record<string, unknown>): 'noun' | 'verb' | null {
    const posRaw = this.firstText(item, ['pos', 'pos2']).toLowerCase();
    if (posRaw === 'noun' || posRaw === 'adj') return 'noun';
    if (posRaw === 'verb') return 'verb';
    return null;
  }

  private firstText(item: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = this.textFromUnknown(item[key]);
      if (value) return value;
    }
    return '';
  }

  private textFromUnknown(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  private numberFromUnknown(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.trunc(numeric);
  }

  private toMorphologyPills(items: Array<Record<string, unknown>>, prefix: 'noun' | 'verb'): AppPillItem[] {
    return items.map((item, index) => {
      const ref = this.morphologyRef(item);
      const root = this.morphologyRoot(item);
      return {
        id: this.morphologyPillId(item, index, prefix),
        primary: this.morphologyWord(item),
        secondary: root || undefined,
      };
    });
  }

  private morphologyPillId(item: Record<string, unknown>, index: number, prefix: 'noun' | 'verb'): string {
    const ref = this.morphologyRef(item);
    return ref === '—' ? `${prefix}-${index}` : `${prefix}-${ref}-${index}`;
  }

  private findMorphologyItemByPill(pill: AppPillItem): Record<string, unknown> | null {
    const pillId = pill.id == null ? '' : String(pill.id);
    if (pillId) {
      for (let index = 0; index < this.nounMorphologyItems.length; index += 1) {
        const item = this.nounMorphologyItems[index];
        if (this.morphologyPillId(item, index, 'noun') === pillId) return item;
      }
      for (let index = 0; index < this.verbMorphologyItems.length; index += 1) {
        const item = this.verbMorphologyItems[index];
        if (this.morphologyPillId(item, index, 'verb') === pillId) return item;
      }
    }

    const primary = pill.primary.trim();
    const secondary = (pill.secondary ?? '').trim();
    const fallbackMatch = this.morphologyItems.find((entry) => {
      const word = this.morphologyWord(entry);
      const root = this.morphologyRoot(entry);
      return word === primary && root === secondary;
    });
    return fallbackMatch ?? null;
  }

  private buildMorphologySelection(item: Record<string, unknown>): QuranWordInspectorSelection | null {
    const text =
      this.morphologyWord(item) !== '—'
        ? this.morphologyWord(item)
        : this.firstText(item, ['surface_ar', 'lemma_ar', 'surface_norm', 'word', 'text']);
    if (!text) return null;

    const surah = this.numberFromUnknown(item['surah']);
    const ayah = this.numberFromUnknown(item['ayah']);
    const tokenIndex = this.numberFromUnknown(item['token_index']);
    const location = this.resolveMorphologyLocation(item, surah, ayah, tokenIndex);

    return {
      text,
      location: location || text,
      surah,
      ayah,
      tokenIndex,
    };
  }

  private resolveMorphologyLocation(
    item: Record<string, unknown>,
    surah: number | null,
    ayah: number | null,
    tokenIndex: number | null
  ): string {
    const direct = this.textFromUnknown(item['word_location']);
    if (direct) return direct;
    if (surah != null && ayah != null && tokenIndex != null) return `${surah}:${ayah}:${tokenIndex}`;
    if (surah != null && ayah != null) return `${surah}:${ayah}`;
    return '';
  }

  private normalizeMorphologyDisplayText(value: string): string {
    const stripped = this.stripArabicDiacritics(value);
    return stripped || value.trim();
  }

  private objectArray(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)) as Array<Record<string, unknown>>;
  }

  private pickFirst(payload: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        const text = ['text', 'value', 'label', 'title', 'description']
          .map((nestedKey) => nested[nestedKey])
          .find((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
        if (text) return text.trim();
      }
    }
    return '';
  }

  private toTitle(value: string): string {
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
