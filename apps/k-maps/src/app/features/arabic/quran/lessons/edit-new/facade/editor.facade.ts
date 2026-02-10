import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { API_BASE } from '../../../../../../shared/api-base';
import { AuthService } from '../../../../../../shared/services/AuthService';
import { QuranDataService } from '../../../../../../shared/services/quran-data.service';
import { parseRefPart } from '../../lesson-utils';
import { buildContainerPayload } from '../domain/container-payload.builder';
import { buildLessonPayload } from '../domain/lesson-payload.builder';
import { normalizeSurahQuery } from '../domain/normalize-surah-query';
import { EditorState, TaskTab, TaskType } from '../models/editor.types';
import { setLessonLocked, setRange, setReferenceLocked, setSaving, setStatus, setUnlockedStep } from '../state/editor.actions';
import { buildTaskTabs, createEditorState, resetEditorState } from '../state/editor.state';
import { selectGeneratedContainerTitle, selectSelectedAyahs } from '../state/editor.selectors';

@Injectable()
export class QuranLessonEditorFacade {
  readonly state: EditorState = createEditorState();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly quranData: QuranDataService
  ) {}

  async init() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.state.lessonId = idParam;
      this.state.isNew = false;
    }

    await this.loadSurahs();
    if (this.state.lessonId) {
      await this.loadLesson();
    }
  }

  selectStep(index: number) {
    if (index < 0 || index >= this.state.steps.length) return;
    if (index > this.state.unlockedStepIndex) return;
    this.state.activeStepIndex = index;
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
  }

  setEnd(ayah: { ayah: number }) {
    if (this.state.referenceLocked) return;
    if (this.state.rangeStart === null) {
      this.state.rangeStart = ayah.ayah;
      this.state.rangeEnd = ayah.ayah;
      return;
    }
    this.state.rangeEnd = ayah.ayah;
    if (this.state.rangeEnd < this.state.rangeStart) {
      const temp = this.state.rangeEnd;
      this.state.rangeEnd = this.state.rangeStart;
      this.state.rangeStart = temp;
    }
  }

  clearRange() {
    if (this.state.referenceLocked) return;
    setRange(this.state, null, null);
  }

  setRangeStartValue(value: number | null) {
    if (this.state.referenceLocked) return;
    const numeric = value == null ? null : Number(value);
    if (numeric == null || Number.isNaN(numeric)) {
      setRange(this.state, null, null);
      return;
    }
    const end = this.state.rangeEnd ?? numeric;
    const min = Math.min(numeric, end);
    const max = Math.max(numeric, end);
    setRange(this.state, min, max);
  }

  setRangeEndValue(value: number | null) {
    if (this.state.referenceLocked) return;
    const numeric = value == null ? null : Number(value);
    if (numeric == null || Number.isNaN(numeric)) {
      setRange(this.state, this.state.rangeStart, null);
      return;
    }
    const start = this.state.rangeStart ?? numeric;
    const min = Math.min(start, numeric);
    const max = Math.max(start, numeric);
    setRange(this.state, min, max);
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

  selectTaskTab(type: TaskType) {
    this.state.activeTaskType = type;
  }

  getActiveTaskTab(): TaskTab | null {
    return this.state.taskTabs.find((tab) => tab.type === this.state.activeTaskType) ?? null;
  }

  async saveTask(type: TaskType) {
    if (!this.state.lessonId || !this.state.passageUnitId) {
      setStatus(this.state, 'error', 'Save lesson metadata before adding tasks.');
      return;
    }
    const tab = this.state.taskTabs.find((entry) => entry.type === type);
    if (!tab) return;
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
      this.state.activeTaskType = tabs[0]?.type ?? 'reading';
    } catch (err: any) {
      setStatus(this.state, 'error', err?.message ?? 'Failed to load tasks.');
    }
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
