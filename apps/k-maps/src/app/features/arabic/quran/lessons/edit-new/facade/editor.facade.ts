import { Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { API_BASE } from '../../../../../../shared/api-base';
import { AuthService } from '../../../../../../shared/services/AuthService';
import { PageHeaderTabsConfig } from '../../../../../../shared/models/core/page-header.model';
import { PageHeaderService } from '../../../../../../shared/services/page-header.service';
import { QuranDataService } from '../../../../../../shared/services/quran-data.service';
import { parseRefPart } from '../../lesson-utils';
import { buildContainerPayload } from '../domain/container-payload.builder';
import { buildLessonPayload } from '../domain/lesson-payload.builder';
import { normalizeSurahQuery } from '../domain/normalize-surah-query';
import { EditorState, EditorStepId, SentenceCandidate, SentenceSubTab, TaskTab, TaskType } from '../models/editor.types';
import { setLessonLocked, setRange, setReferenceLocked, setSaving, setStatus, setUnlockedStep } from '../state/editor.actions';
import { buildTaskTabs, createEditorState, resetEditorState } from '../state/editor.state';
import { selectGeneratedContainerTitle, selectSelectedAyahs } from '../state/editor.selectors';

const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

@Injectable()
export class QuranLessonEditorFacade {
  readonly state: EditorState = createEditorState();
  private syncingQuery = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly pageHeader: PageHeaderService,
    private readonly quranData: QuranDataService
  ) {}

  async init() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.state.lessonId = idParam;
      this.state.isNew = false;
    }

    this.route.queryParamMap.subscribe((params) => {
      if (this.syncingQuery) return;
      this.applyQueryParams(params);
    });

    await this.loadSurahs();
    if (this.state.lessonId) {
      await this.loadLesson();
    }
    this.updateHeaderTabs();
  }

  selectStep(index: number, syncUrl = true) {
    if (index < 0 || index >= this.state.steps.length) return;
    if (index > this.state.unlockedStepIndex) return;
    this.state.activeStepIndex = index;
    this.updateHeaderTabs();
    if (syncUrl) {
      const stepId = this.state.steps[index]?.id;
      if (stepId) this.syncQueryParams({ step: stepId });
    }
  }

  selectStepById(stepId: EditorStepId, syncUrl = true) {
    const index = this.state.steps.findIndex((step) => step.id === stepId);
    if (index === -1) return;
    this.selectStep(index, syncUrl);
  }

  prevStep() {
    this.selectStep(this.state.activeStepIndex - 1);
  }

  nextStep() {
    const nextIndex = this.state.activeStepIndex + 1;
    if (nextIndex > this.state.unlockedStepIndex) return;
    this.selectStep(nextIndex);
  }

  clearDraft() {
    const wasEditing = !this.state.isNew;
    resetEditorState(this.state);
    this.updateHeaderTabs();
    if (wasEditing) {
      this.router.navigate(['/arabic/quran/lessons/new'], { replaceUrl: true });
    }
  }

  back() {
    this.router.navigate(['/arabic/quran/lessons']);
  }

  async loadSurahs() {
    try {
      const res = await this.quranData.listSurahs({ page: 1, pageSize: 200 });
      this.state.surahs = res.results ?? [];
      if (!this.state.selectedSurah && this.state.surahs.length && !this.state.lessonId) {
        this.state.selectedSurah = this.state.surahs[0]!.surah;
      }
      if (this.state.selectedSurah && !this.state.lessonId) {
        await this.loadAyahs(this.state.selectedSurah);
      }
    } catch (err: any) {
      this.state.ayahError = err?.message ?? 'Failed to load surahs.';
    }
  }

  async loadAyahs(surah: number) {
    this.state.loadingAyahs = true;
    this.state.ayahError = '';
    try {
      const res = await this.quranData.listAyahs({ surah, pageSize: 300 });
      this.state.ayahs = (res.verses ?? res.results ?? []) as any[];
    } catch (err: any) {
      this.state.ayahError = err?.message ?? 'Failed to load ayahs.';
      this.state.ayahs = [];
    } finally {
      this.state.loadingAyahs = false;
    }
  }

  onSurahChange() {
    if (this.state.referenceLocked) return;
    if (!this.state.selectedSurah) return;
    setRange(this.state, null, null);
    this.resetSentenceSelection();
    this.loadAyahs(this.state.selectedSurah);
  }

  onSurahQueryChange() {
    if (this.state.referenceLocked) return;
    const query = normalizeSurahQuery(this.state.surahQuery);
    if (!query) return;
    const digits = query.replace(/[^0-9]/g, '');
    if (!digits) return;
    const surahNumber = Number(digits);
    if (!Number.isInteger(surahNumber)) return;
    const match = this.state.surahs.find((surah) => surah.surah === surahNumber);
    if (match && this.state.selectedSurah !== match.surah) {
      this.state.selectedSurah = match.surah;
      this.onSurahChange();
    }
  }

  setStart(ayah: { ayah: number }) {
    if (this.state.referenceLocked) return;
    this.state.rangeStart = ayah.ayah;
    if (this.state.rangeEnd !== null && this.state.rangeEnd < this.state.rangeStart) {
      const temp = this.state.rangeEnd;
      this.state.rangeEnd = this.state.rangeStart;
      this.state.rangeStart = temp;
    }
    this.resetSentenceSelection();
  }

  setEnd(ayah: { ayah: number }) {
    if (this.state.referenceLocked) return;
    if (this.state.rangeStart === null) {
      this.state.rangeStart = ayah.ayah;
      this.state.rangeEnd = ayah.ayah;
      this.resetSentenceSelection();
      return;
    }
    this.state.rangeEnd = ayah.ayah;
    if (this.state.rangeEnd < this.state.rangeStart) {
      const temp = this.state.rangeEnd;
      this.state.rangeEnd = this.state.rangeStart;
      this.state.rangeStart = temp;
    }
    this.resetSentenceSelection();
  }

  clearRange() {
    if (this.state.referenceLocked) return;
    setRange(this.state, null, null);
    this.resetSentenceSelection();
  }

  setRangeStartValue(value: number | null) {
    if (this.state.referenceLocked) return;
    const numeric = value == null ? null : Number(value);
    if (numeric == null || Number.isNaN(numeric)) {
      setRange(this.state, null, null);
      this.resetSentenceSelection();
      return;
    }
    const end = this.state.rangeEnd ?? numeric;
    const min = Math.min(numeric, end);
    const max = Math.max(numeric, end);
    setRange(this.state, min, max);
    this.resetSentenceSelection();
  }

  setRangeEndValue(value: number | null) {
    if (this.state.referenceLocked) return;
    const numeric = value == null ? null : Number(value);
    if (numeric == null || Number.isNaN(numeric)) {
      setRange(this.state, this.state.rangeStart, null);
      this.resetSentenceSelection();
      return;
    }
    const start = this.state.rangeStart ?? numeric;
    const min = Math.min(start, numeric);
    const max = Math.max(start, numeric);
    setRange(this.state, min, max);
    this.resetSentenceSelection();
  }

  async loadLesson() {
    if (!this.state.lessonId) return;
    try {
      const data = await this.request(`${API_BASE}/ar/quran/lessons/${this.state.lessonId}`);
      const result = data?.result ?? {};
      const lessonRow = result?.lesson_row ?? {};
      const lessonJson = result?.lesson_json ?? {};
      const container = result?.container ?? {};
      const units = (result?.units ?? []) as Array<any>;
      const passageUnit = units.find((unit) => unit?.unit_type === 'passage') ?? units[0] ?? null;

      const meta = lessonJson?.meta ?? {};
      this.state.lessonTitleEn = meta?.title ?? this.state.lessonTitleEn;
      this.state.lessonTitleAr = meta?.title_ar ?? this.state.lessonTitleAr;
      this.state.lessonSubtype = meta?.subtype ?? this.state.lessonSubtype;
      const difficulty = Number(meta?.difficulty);
      if (Number.isFinite(difficulty)) {
        this.state.lessonDifficulty = difficulty;
      }

      this.state.lessonJsonRaw = this.serializeLessonJson(lessonJson);

      this.state.containerId = lessonRow?.container_id ?? container?.id ?? this.state.containerId;
      this.state.passageUnitId = lessonRow?.unit_id ?? passageUnit?.id ?? this.state.passageUnitId;

      const surah = parseRefPart(passageUnit?.start_ref ?? null, 0);
      const ayahFrom = passageUnit?.ayah_from ?? parseRefPart(passageUnit?.start_ref ?? null, 1);
      const ayahTo = passageUnit?.ayah_to ?? parseRefPart(passageUnit?.end_ref ?? null, 1);

      if (surah) {
        this.state.selectedSurah = surah;
        await this.loadAyahs(surah);
      }
      if (ayahFrom != null) {
        this.state.rangeStart = ayahFrom;
        this.state.rangeEnd = ayahTo ?? ayahFrom;
      }
      this.resetSentenceSelection();
      if (this.state.containerId && this.state.passageUnitId) {
        setReferenceLocked(this.state, true);
        setUnlockedStep(this.state, 2);
      }
      if (this.state.lessonTitleEn || this.state.lessonTitleAr) {
        if (this.state.isNew) {
          setLessonLocked(this.state, true);
        }
        setUnlockedStep(this.state, 3);
      }
      if (this.state.lessonLocked) {
        this.state.activeStepIndex = 3;
      } else if (this.state.referenceLocked) {
        this.state.activeStepIndex = 1;
      }

      await this.loadTasks();
      this.updateHeaderTabs();
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to load lesson.');
    }
  }

  async lockReference() {
    if (!this.state.selectedSurah || this.state.rangeStart == null) {
      setStatus(this.state, 'error', 'Select a surah and ayah range first.');
      return;
    }
    if (this.state.referenceLocked) {
      return;
    }
    setSaving(this.state, 'container', true);
    setStatus(this.state, 'info', 'Creating container + unit...');
    try {
      const rangeAyahs = selectSelectedAyahs(this.state);
      const textCache = rangeAyahs.map((a) => a.text_uthmani || a.text || '').filter(Boolean).join(' ');
      const payload = buildContainerPayload(this.state, textCache, selectGeneratedContainerTitle(this.state));
      const data = await this.request(`${API_BASE}/ar/quran/lessons/create`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const container = data?.result?.container;
      const units = data?.result?.units ?? [];
      const passageUnit = units.find((unit: any) => unit.unit_type === 'passage') ?? units[0];
      this.state.containerId = container?.id ?? null;
      this.state.passageUnitId = passageUnit?.id ?? null;
      setReferenceLocked(this.state, true);
      setStatus(this.state, 'success', 'Reference locked. Unit created.');
      setUnlockedStep(this.state, 1);
      this.selectStep(1);
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to lock reference.');
    } finally {
      setSaving(this.state, 'container', false);
    }
  }

  continueToLesson() {
    if (!this.state.referenceLocked) {
      setStatus(this.state, 'error', 'Reference must be locked first.');
      return;
    }
    setUnlockedStep(this.state, 2);
    this.selectStep(2);
  }

  async saveLessonMeta() {
    if (!this.state.lessonTitleEn.trim()) {
      setStatus(this.state, 'error', 'English title is required.');
      return;
    }
    if (!this.state.lessonTitleAr.trim()) {
      setStatus(this.state, 'error', 'Arabic title is required.');
      return;
    }
    if (!this.state.lessonSubtype.trim()) {
      setStatus(this.state, 'error', 'Subtype is required.');
      return;
    }
    if (!this.state.lessonDifficulty) {
      setStatus(this.state, 'error', 'Difficulty is required.');
      return;
    }
    if (!this.state.containerId || !this.state.passageUnitId) {
      setStatus(this.state, 'error', 'Reference must be locked first.');
      return;
    }

    const extraLessonJson = this.parseLessonJsonRaw();
    if (extraLessonJson === null) {
      return;
    }

    setSaving(this.state, 'lesson', true);
    setStatus(this.state, 'info', this.state.lessonId ? 'Saving lesson...' : 'Creating lesson...');
    try {
      if (!this.state.lessonId) {
        const payload = {
          ...buildLessonPayload(this.state, false, extraLessonJson),
          status: 'draft',
        };
        const data = await this.request(`${API_BASE}/ar/quran/lessons`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        this.state.lessonId = String(data?.result?.id ?? '');
        this.state.isNew = false;
        if (this.state.lessonId) {
          this.router.navigate(['/arabic/quran/lessons', this.state.lessonId, 'edit'], { replaceUrl: true });
        }
      }

      if (this.state.lessonId) {
        await this.request(`${API_BASE}/ar/quran/lessons/${this.state.lessonId}`, {
          method: 'PUT',
          body: JSON.stringify(buildLessonPayload(this.state, true, extraLessonJson)),
        });
      }

      setLessonLocked(this.state, true);
      setStatus(this.state, 'success', 'Lesson metadata saved.');
      setUnlockedStep(this.state, 3);
      this.selectStep(3);
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to save lesson.');
    } finally {
      setSaving(this.state, 'lesson', false);
    }
  }

  private parseLessonJsonRaw(): Record<string, unknown> | null {
    const raw = this.state.lessonJsonRaw.trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setStatus(this.state, 'error', 'Lesson JSON must be an object.');
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Invalid lesson JSON.');
      return null;
    }
  }

  private serializeLessonJson(lessonJson: any): string {
    if (!lessonJson || typeof lessonJson !== 'object' || Array.isArray(lessonJson)) {
      return '';
    }
    const copy = { ...lessonJson } as Record<string, unknown>;
    if ('meta' in copy) {
      delete copy['meta'];
    }
    if (!Object.keys(copy).length) {
      return '';
    }
    return JSON.stringify(copy, null, 2);
  }

  setDifficulty(level: number) {
    if (this.state.lessonLocked) return;
    this.state.lessonDifficulty = level;
  }

  selectTaskTab(type: TaskType, syncUrl = true) {
    this.state.activeTaskType = type;
    if (type === 'sentence_structure') {
      this.state.sentenceSubTab = 'verses';
      this.state.sentenceAyahSelections = selectSelectedAyahs(this.state).map((ayah) => ayah.ayah);
      if (!this.state.sentenceLoadedAyahs.length) {
        this.loadSentenceVerses();
      }
    }
    if (syncUrl) {
      this.syncQueryParams({ task: type });
    }
  }

  getActiveTaskTab(): TaskTab | null {
    return this.state.taskTabs.find((tab) => tab.type === this.state.activeTaskType) ?? null;
  }

  getSentenceItems(): Array<Record<string, unknown>> {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return [];
    const parsed = this.parseTaskJsonObject(tab.json);
    const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
    return items.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }

  selectSentenceSubTab(tab: SentenceSubTab, syncUrl = true) {
    this.state.sentenceSubTab = tab;
    if (syncUrl) {
      this.syncQueryParams({ sub: tab });
    }
  }

  toggleSentenceAyah(ayah: number) {
    const next = new Set(this.state.sentenceAyahSelections);
    if (next.has(ayah)) {
      next.delete(ayah);
    } else {
      next.add(ayah);
    }
    this.state.sentenceAyahSelections = Array.from(next).sort((a, b) => a - b);
  }

  selectAllSentenceAyahs() {
    const ayahs = selectSelectedAyahs(this.state).map((a) => a.ayah);
    this.state.sentenceAyahSelections = ayahs;
  }

  clearSentenceAyahs() {
    this.state.sentenceAyahSelections = [];
  }

  loadSentenceVerses() {
    const selection = this.state.sentenceAyahSelections;
    if (selection.length) {
      this.state.sentenceLoadedAyahs = [...selection].sort((a, b) => a - b);
    } else {
      this.state.sentenceLoadedAyahs = selectSelectedAyahs(this.state).map((a) => a.ayah);
    }
    this.state.sentenceCandidates = [];
  }

  extractSentenceCandidates() {
    const loaded = this.getSentenceLoadedAyahs();
    if (!loaded.length) {
      setStatus(this.state, 'error', 'Load verses first.');
      return;
    }
    const candidates: SentenceCandidate[] = loaded.map((ayah) => ({
      id: `cand-${ayah.ayah}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: this.getPlainAyahText(ayah),
      ayah: ayah.ayah ?? null,
      source: 'ayah',
    }));
    this.state.sentenceCandidates = candidates.filter((c) => c.text);
  }

  addSelectionAsSentence(text: string) {
    const cleaned = this.stripArabicDiacritics(text.replace(/\s+/g, ' ').trim());
    if (!cleaned) {
      setStatus(this.state, 'error', 'Select Arabic text to add as a sentence.');
      return;
    }
    const candidate: SentenceCandidate = {
      id: `cand-selection-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: cleaned,
      ayah: null,
      source: 'selection',
    };
    this.state.sentenceCandidates = [candidate, ...this.state.sentenceCandidates];
  }

  async addSentenceTextToTask(text: string, ayah: number | null = null, source: SentenceCandidate['source'] = 'selection') {
    const cleaned = this.stripArabicDiacritics(text.replace(/\s+/g, ' ').trim());
    if (!cleaned) {
      setStatus(this.state, 'error', 'Select Arabic text to add as a sentence.');
      return;
    }
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;
    const parsed = this.parseTaskJsonObject(tab.json);
    const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
    const nextOrder = this.nextSentenceOrder(items);
    items.push({
      sentence_order: nextOrder,
      canonical_sentence: cleaned,
      steps: [],
      source,
      ayah,
    });
    parsed['schema_version'] = parsed['schema_version'] ?? 1;
    parsed['task_type'] = 'sentence_structure';
    parsed['items'] = items;
    tab.json = JSON.stringify(parsed, null, 2);
    setStatus(this.state, 'success', 'Sentence added to task (local).');
  }

  async addSentenceCandidateToTask(candidate: SentenceCandidate) {
    if (!this.state.lessonId || !this.state.containerId || !this.state.passageUnitId) {
      setStatus(this.state, 'error', 'Save lesson metadata before adding sentences.');
      return;
    }
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;

    this.state.sentenceResolvingId = candidate.id;
    try {
      const resolved = await this.request(`${API_BASE}/ar/quran/resolve/sentence`, {
        method: 'POST',
        body: JSON.stringify({
          text_ar: candidate.text,
          source: {
            container_id: this.state.containerId,
            ayah: candidate.ayah,
          },
        }),
      });
      const arUSentence = resolved?.result?.ar_u_sentence ?? null;
      const parsed = this.parseTaskJsonObject(tab.json);
      const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
      const nextOrder = this.nextSentenceOrder(items);
      items.push({
        sentence_order: nextOrder,
        canonical_sentence: candidate.text,
        ar_u_sentence: arUSentence,
        steps: [],
      });
      parsed['schema_version'] = parsed['schema_version'] ?? 1;
      parsed['task_type'] = 'sentence_structure';
      parsed['items'] = items;
      tab.json = JSON.stringify(parsed, null, 2);
      this.state.sentenceCandidates = this.state.sentenceCandidates.filter((item) => item.id !== candidate.id);
      setStatus(this.state, 'success', 'Sentence added to task.');
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to resolve sentence.');
    } finally {
      this.state.sentenceResolvingId = null;
    }
  }

  removeSentenceItem(index: number) {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;
    const parsed = this.parseTaskJsonObject(tab.json);
    const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    parsed['items'] = items;
    tab.json = JSON.stringify(parsed, null, 2);
  }

  updateSentenceItem(index: number, text: string) {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;
    const cleaned = this.stripArabicDiacritics(text.replace(/\s+/g, ' ').trim());
    if (!cleaned) {
      setStatus(this.state, 'error', 'Sentence text cannot be empty.');
      return;
    }
    const parsed = this.parseTaskJsonObject(tab.json);
    const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (item && typeof item === 'object') {
      (item as Record<string, unknown>)['canonical_sentence'] = cleaned;
      if ('ar_u_sentence' in (item as Record<string, unknown>)) {
        delete (item as Record<string, unknown>)['ar_u_sentence'];
      }
    }
    parsed['items'] = items;
    tab.json = JSON.stringify(parsed, null, 2);
    setStatus(this.state, 'success', 'Sentence updated.');
  }

  validateTaskJson(type: TaskType) {
    const tab = this.state.taskTabs.find((entry) => entry.type === type);
    if (!tab) return;
    const parsed = this.parseTaskJson(tab.json);
    if (parsed === null) return;
    if (type === 'sentence_structure') {
      const obj = this.parseTaskJsonObject(tab.json);
      const items = Array.isArray(obj['items']) ? obj['items'] : [];
      if (!items.length) {
        setStatus(this.state, 'error', 'Sentence Structure requires items[].');
        return;
      }
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i] as Record<string, unknown>;
        const sentence = typeof item['canonical_sentence'] === 'string' ? item['canonical_sentence'].trim() : '';
        if (!sentence) {
          setStatus(this.state, 'error', `items[${i}].canonical_sentence missing.`);
          return;
        }
      }
    }
    setStatus(this.state, 'success', 'Task JSON looks valid.');
  }

  formatTaskJson(type: TaskType) {
    const tab = this.state.taskTabs.find((entry) => entry.type === type);
    if (!tab) return;
    const parsed = this.parseTaskJson(tab.json);
    if (parsed === null) return;
    tab.json = JSON.stringify(parsed, null, 2);
    setStatus(this.state, 'success', 'Task JSON formatted.');
  }

  async saveTask(type: TaskType) {
    if (!this.state.lessonId || !this.state.passageUnitId) {
      setStatus(this.state, 'error', 'Save lesson metadata before adding tasks.');
      return;
    }
    const tab = this.state.taskTabs.find((entry) => entry.type === type);
    if (!tab) return;
    if (type === 'sentence_structure') {
      await this.commitSentenceTask(tab);
      return;
    }
    const parsed = type === 'reading' ? this.buildReadingTaskJson() : this.parseTaskJson(tab.json);
    if (parsed === null) {
      return;
    }

    this.state.taskSavingType = type;
    setStatus(this.state, 'info', `Saving ${tab.label} task...`);
    try {
      const payload = {
        task_type: tab.type,
        task_name: tab.label,
        task_json: parsed,
        status: 'draft',
      };
      await this.request(`${API_BASE}/ar/quran/lessons/${this.state.lessonId}/tasks`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setStatus(this.state, 'success', `${tab.label} task saved.`);
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to save task.');
    } finally {
      this.state.taskSavingType = null;
    }
  }

  private async commitSentenceTask(tab: TaskTab) {
    if (!this.state.lessonId || !this.state.containerId || !this.state.passageUnitId) {
      setStatus(this.state, 'error', 'Save lesson metadata before adding tasks.');
      return;
    }
    const parsed = this.parseTaskJson(tab.json);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setStatus(this.state, 'error', 'Sentence Structure JSON must be an object.');
      return;
    }

    this.state.taskSavingType = tab.type;
    setStatus(this.state, 'info', 'Committing Sentence Structure task...');
    try {
      const payload = {
        container_id: this.state.containerId,
        unit_id: this.state.passageUnitId,
        task_type: tab.type,
        task_json: parsed,
      };
      const data = await this.request(`${API_BASE}/ar/quran/lessons/${this.state.lessonId}/tasks/commit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const taskJson = data?.result?.task_json;
      if (taskJson) {
        tab.json = JSON.stringify(taskJson, null, 2);
      }
      setStatus(this.state, 'success', 'Sentence Structure committed.');
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to commit sentence task.');
    } finally {
      this.state.taskSavingType = null;
    }
  }

  private buildReadingTaskJson(): Record<string, unknown> | null {
    if (!this.state.selectedSurah || this.state.rangeStart == null) {
      setStatus(this.state, 'error', 'Select a surah and ayah range first.');
      return null;
    }
    const ayahTo = this.state.rangeEnd ?? this.state.rangeStart;
    const rangeAyahs = selectSelectedAyahs(this.state);
    const readingText = rangeAyahs
      .map((ayah) => ayah.text_uthmani || ayah.text || '')
      .filter(Boolean)
      .join(' ');

    return {
      unit_id: this.state.passageUnitId,
      surah: this.state.selectedSurah,
      ayah_from: this.state.rangeStart,
      ayah_to: ayahTo,
      reading_text: readingText,
    };
  }

  private async loadTasks() {
    if (!this.state.lessonId) return;
    try {
      const data = await this.request(`${API_BASE}/ar/quran/lessons/${this.state.lessonId}/tasks`);
      const tasks = (data?.result?.tasks ?? []) as Array<any>;
      if (!tasks.length) {
        this.state.taskTabs = buildTaskTabs();
        this.state.activeTaskType = this.state.taskTabs[0]?.type ?? 'reading';
        this.ensureSentenceVersesLoaded();
        return;
      }
      const tabs = buildTaskTabs();
      for (const task of tasks) {
        const tab = tabs.find((entry) => entry.type === task.task_type);
        if (!tab) continue;
        if (task.task_json && typeof task.task_json === 'object') {
          tab.json = JSON.stringify(task.task_json, null, 2);
        }
      }
      this.state.taskTabs = tabs;
      const preferredType = this.state.activeTaskType;
      this.state.activeTaskType = tabs.some((tab) => tab.type === preferredType) ? preferredType : (tabs[0]?.type ?? 'reading');
      this.ensureSentenceVersesLoaded();
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to load tasks.');
    }
  }

  private applyQueryParams(params: ParamMap) {
    const step = params.get('step') as EditorStepId | null;
    if (step && this.isStepId(step)) {
      this.selectStepById(step, false);
    }

    const task = params.get('task') as TaskType | null;
    if (task && this.isTaskType(task)) {
      this.selectTaskTab(task, false);
    }

    const sub = params.get('sub') as SentenceSubTab | null;
    if (sub && this.isSentenceSubTab(sub)) {
      this.state.sentenceSubTab = sub;
    }
  }

  private syncQueryParams(params: Record<string, string>) {
    this.syncingQuery = true;
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .finally(() => {
        this.syncingQuery = false;
      });
  }

  private isStepId(value: string): value is EditorStepId {
    return this.state.steps.some((step) => step.id === value);
  }

  private isTaskType(value: string): value is TaskType {
    return this.state.taskTabs.some((tab) => tab.type === value);
  }

  private isSentenceSubTab(value: string): value is SentenceSubTab {
    return value === 'verses' || value === 'items' || value === 'json';
  }

  private parseTaskJson(raw: string): Record<string, unknown> | unknown[] | null {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        setStatus(this.state, 'error', 'Task JSON must be an object or array.');
        return null;
      }
      return parsed as Record<string, unknown> | unknown[];
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Invalid task JSON.');
      return null;
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

  private nextSentenceOrder(items: unknown[]): number {
    const orders = items
      .map((item) => (item && typeof item === 'object' ? Number((item as Record<string, unknown>)['sentence_order']) : NaN))
      .filter((value) => Number.isFinite(value)) as number[];
    if (!orders.length) return 1;
    return Math.max(...orders) + 1;
  }

  private getSentenceLoadedAyahs() {
    if (!this.state.sentenceLoadedAyahs.length) return [];
    const lookup = new Set(this.state.sentenceLoadedAyahs);
    return this.state.ayahs.filter((ayah) => lookup.has(ayah.ayah));
  }

  getPlainAyahText(ayah: any): string {
    const raw = ayah?.text_simple || ayah?.text_imlaei_simple || ayah?.text_uthmani || ayah?.text || '';
    return this.stripArabicDiacritics(String(raw));
  }

  private stripArabicDiacritics(text: string): string {
    return text.normalize('NFKC').replace(ARABIC_DIACRITICS_RE, '').trim();
  }

  private resetSentenceSelection() {
    this.state.sentenceAyahSelections = selectSelectedAyahs(this.state).map((ayah) => ayah.ayah);
    this.state.sentenceLoadedAyahs = [];
    this.state.sentenceCandidates = [];
  }

  private ensureSentenceVersesLoaded() {
    if (this.state.activeTaskType !== 'sentence_structure') return;
    this.state.sentenceAyahSelections = selectSelectedAyahs(this.state).map((ayah) => ayah.ayah);
    if (!this.state.sentenceLoadedAyahs.length) {
      this.loadSentenceVerses();
    }
  }

  destroy() {
    this.pageHeader.clearTabs();
  }

  private updateHeaderTabs() {
    const baseCommands = this.getEditorCommands();
    const activeTabId = this.state.steps[this.state.activeStepIndex]?.id ?? 'container';
    const tabs = this.state.steps.map((step, index) => ({
      id: step.id,
      label: step.label,
      commands: baseCommands,
      queryParams: { step: step.id },
      disabled: index > this.state.unlockedStepIndex,
    }));
    const config: PageHeaderTabsConfig = {
      activeTabId,
      tabs,
    };
    this.pageHeader.setTabs(config);
  }

  private getEditorCommands(): any[] {
    if (this.state.lessonId) {
      return ['/arabic/quran/lessons', this.state.lessonId, 'edit'];
    }
    return ['/arabic/quran/lessons', 'new'];
  }

  private async request(url: string, init: RequestInit = {}) {
    const headers: HeadersInit = {
      'content-type': 'application/json',
      ...this.auth.authHeaders(),
      ...(init.headers ?? {}),
    };
    const res = await fetch(url, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error ?? data?.message ?? `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }
}
