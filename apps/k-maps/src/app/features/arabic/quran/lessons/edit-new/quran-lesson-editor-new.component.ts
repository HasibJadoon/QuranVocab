import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { API_BASE } from '../../../../../shared/api-base';
import { AuthService } from '../../../../../shared/services/AuthService';
import { QuranDataService } from '../../../../../shared/services/quran-data.service';
import { QuranAyah, QuranAyahWord, QuranSurah } from '../../../../../shared/models/arabic/quran-data.model';

type Step = {
  id: string;
  label: string;
  intent: string;
};

@Component({
  selector: 'app-quran-lesson-editor-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quran-lesson-editor-new.component.html',
  styleUrls: ['./quran-lesson-editor-new.component.scss'],
})
export class QuranLessonEditorNewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly quranData = inject(QuranDataService);

  lessonId: string | null = null;
  isNew = true;

  surahs: QuranSurah[] = [];
  selectedSurah: number | null = null;
  ayahs: QuranAyah[] = [];
  loadingAyahs = false;
  ayahError = '';

  rangeStart: number | null = null;
  rangeEnd: number | null = null;

  containerTitle = '';
  containerId: string | null = null;
  passageUnitId: string | null = null;

  steps: Step[] = [
    { id: 'container', label: 'Container', intent: 'Set the container details for this lesson.' },
    { id: 'unit', label: 'Unit', intent: 'Select the surah + verse range for the passage unit.' },
    { id: 'lesson', label: 'Lesson', intent: 'Name the lesson and finalize details.' },
  ];

  activeStepIndex = 0;

  lessonTitle = '';
  lessonNote = '';
  metaJson = '{\n  \"status\": \"draft\"\n}';
  statusMessage = '';
  statusTone: 'info' | 'success' | 'error' | 'idle' = 'idle';
  savingLesson = false;
  savingContainer = false;

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.lessonId = idParam;
      this.isNew = false;
    }

    await this.loadSurahs();
    if (this.lessonId) {
      await this.loadLesson();
    }
  }

  get activeStep() {
    return this.steps[this.activeStepIndex];
  }

  selectStep(index: number) {
    if (index < 0 || index >= this.steps.length) return;
    this.activeStepIndex = index;
  }

  prevStep() {
    this.selectStep(this.activeStepIndex - 1);
  }

  nextStep() {
    this.selectStep(this.activeStepIndex + 1);
  }

  clearDraft() {
    const wasEditing = !this.isNew;
    this.lessonTitle = '';
    this.lessonNote = '';
    this.metaJson = '{\n  \"status\": \"draft\"\n}';
    this.lessonId = null;
    this.isNew = true;
    this.activeStepIndex = 0;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.containerTitle = '';
    this.containerId = null;
    this.passageUnitId = null;
    this.statusMessage = '';
    this.statusTone = 'idle';
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
      this.surahs = res.results ?? [];
      if (!this.selectedSurah && this.surahs.length && !this.lessonId) {
        this.selectedSurah = this.surahs[0]!.surah;
      }
      if (this.selectedSurah && !this.lessonId) {
        await this.loadAyahs(this.selectedSurah);
      }
    } catch (err: any) {
      this.ayahError = err?.message ?? 'Failed to load surahs.';
    }
  }

  async loadAyahs(surah: number) {
    this.loadingAyahs = true;
    this.ayahError = '';
    try {
      const res = await this.quranData.listAyahs({ surah, pageSize: 300 });
      this.ayahs = (res.verses ?? res.results ?? []) as QuranAyah[];
    } catch (err: any) {
      this.ayahError = err?.message ?? 'Failed to load ayahs.';
      this.ayahs = [];
    } finally {
      this.loadingAyahs = false;
    }
  }

  onSurahChange() {
    if (!this.selectedSurah) return;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.loadAyahs(this.selectedSurah);
  }

  setStart(ayah: QuranAyah) {
    this.rangeStart = ayah.ayah;
    if (this.rangeEnd !== null && this.rangeEnd < this.rangeStart) {
      const temp = this.rangeEnd;
      this.rangeEnd = this.rangeStart;
      this.rangeStart = temp;
    }
  }

  setEnd(ayah: QuranAyah) {
    if (this.rangeStart === null) {
      this.rangeStart = ayah.ayah;
      this.rangeEnd = ayah.ayah;
      return;
    }
    this.rangeEnd = ayah.ayah;
    if (this.rangeEnd < this.rangeStart) {
      const temp = this.rangeEnd;
      this.rangeEnd = this.rangeStart;
      this.rangeStart = temp;
    }
  }

  clearRange() {
    this.rangeStart = null;
    this.rangeEnd = null;
  }

  isAyahSelected(ayah: QuranAyah) {
    if (this.rangeStart == null) return false;
    if (this.rangeEnd == null) return ayah.ayah === this.rangeStart;
    const min = Math.min(this.rangeStart, this.rangeEnd);
    const max = Math.max(this.rangeStart, this.rangeEnd);
    return ayah.ayah >= min && ayah.ayah <= max;
  }

  get selectedRangeLabel() {
    if (this.rangeStart == null) return 'No range selected';
    if (this.rangeEnd == null || this.rangeEnd === this.rangeStart) {
      return `Ayah ${this.rangeStart}`;
    }
    return `Ayah ${this.rangeStart} – ${this.rangeEnd}`;
  }

  get selectedAyahs() {
    if (this.rangeStart == null) return [];
    const end = this.rangeEnd ?? this.rangeStart;
    const min = Math.min(this.rangeStart, end);
    const max = Math.max(this.rangeStart, end);
    return this.ayahs.filter((ayah) => ayah.ayah >= min && ayah.ayah <= max);
  }

  wordLabel(word: QuranAyahWord | null | undefined) {
    if (!word) return '';
    if (typeof word === 'string') return word;
    if (word.char_type && word.char_type !== 'word') return '';
    return (
      word.text ||
      word.word_diacritic ||
      word.word_simple ||
      word.simple ||
      word.text_uthmani ||
      ''
    );
  }

  wordTitle(word: QuranAyahWord | null | undefined) {
    if (!word || typeof word === 'string') return '';
    const parts: string[] = [];
    if (word.lemma) parts.push(`Lemma: ${word.lemma}`);
    if (word.root) parts.push(`Root: ${word.root}`);
    return parts.join(' • ');
  }

  private buildLessonPayload(includeContainer: boolean) {
    const payload: Record<string, unknown> = {
      title: this.lessonTitle.trim(),
      lesson_json: {
        note: this.lessonNote?.trim() || null,
        meta: this.parseMetaJson(),
      },
    };
    if (includeContainer) {
      if (this.containerId) payload['container_id'] = this.containerId;
      if (this.passageUnitId) payload['unit_id'] = this.passageUnitId;
    }
    return payload;
  }

  private parseRefPart(ref: string | null, index: number): number | null {
    if (!ref) return null;
    const parts = ref.split(':');
    if (parts.length <= index) return null;
    const value = Number.parseInt(parts[index], 10);
    return Number.isFinite(value) ? value : null;
  }

  async loadLesson() {
    if (!this.lessonId) return;
    try {
      const data = await this.request(`${API_BASE}/ar/quran/lessons/${this.lessonId}`);
      const result = data?.result ?? {};
      const lessonRow = result?.lesson_row ?? {};
      const lessonJson = result?.lesson_json ?? {};
      const container = result?.container ?? {};
      const units = (result?.units ?? []) as Array<any>;
      const passageUnit = units.find((unit) => unit?.unit_type === 'passage') ?? units[0] ?? null;

      this.lessonTitle = lessonRow?.title ?? this.lessonTitle;
      this.lessonNote = lessonJson?.note ?? this.lessonNote;
      if (lessonJson?.meta) {
        this.metaJson = JSON.stringify(lessonJson.meta, null, 2);
      }

      this.containerId = lessonRow?.container_id ?? container?.id ?? this.containerId;
      this.passageUnitId = lessonRow?.unit_id ?? passageUnit?.id ?? this.passageUnitId;
      this.containerTitle = container?.title ?? this.containerTitle;

      const surah = this.parseRefPart(passageUnit?.start_ref ?? null, 0);
      const ayahFrom = passageUnit?.ayah_from ?? this.parseRefPart(passageUnit?.start_ref ?? null, 1);
      const ayahTo = passageUnit?.ayah_to ?? this.parseRefPart(passageUnit?.end_ref ?? null, 1);

      if (surah) {
        this.selectedSurah = surah;
        await this.loadAyahs(surah);
      }
      if (ayahFrom != null) {
        this.rangeStart = ayahFrom;
        this.rangeEnd = ayahTo ?? ayahFrom;
      }
    } catch (err: any) {
      this.statusTone = 'error';
      this.statusMessage = err?.message ?? 'Failed to load lesson.';
    }
  }

  private parseMetaJson(): Record<string, unknown> {
    if (!this.metaJson.trim()) return {};
    try {
      const parsed = JSON.parse(this.metaJson);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return { raw: this.metaJson };
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

  async createLesson() {
    if (!this.lessonTitle.trim()) {
      this.statusTone = 'error';
      this.statusMessage = 'Lesson title is required.';
      return;
    }
    this.savingLesson = true;
    this.statusTone = 'info';
    this.statusMessage = 'Creating lesson...';
    try {
      const payload = {
        title: this.lessonTitle.trim(),
        lesson_json: {
          note: this.lessonNote?.trim() || null,
          meta: this.parseMetaJson(),
        },
        status: 'draft',
      };
      const data = await this.request(`${API_BASE}/ar/quran/lessons`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      this.lessonId = String(data?.result?.id ?? '');
      this.isNew = false;
      if (this.lessonId) {
        this.router.navigate(['/arabic/quran/lessons', this.lessonId, 'edit'], { replaceUrl: true });
      }
      this.statusTone = 'success';
      this.statusMessage = 'Lesson created.';
    } catch (err: any) {
      this.statusTone = 'error';
      this.statusMessage = err?.message ?? 'Failed to create lesson.';
    } finally {
      this.savingLesson = false;
    }
  }

  async saveLesson() {
    if (!this.lessonId) return;
    this.savingLesson = true;
    this.statusTone = 'info';
    this.statusMessage = 'Saving lesson...';
    try {
      const payload: Record<string, unknown> = {
        title: this.lessonTitle.trim(),
        lesson_json: {
          note: this.lessonNote?.trim() || null,
          meta: this.parseMetaJson(),
        },
      };
      if (this.containerId) payload['container_id'] = this.containerId;
      if (this.passageUnitId) payload['unit_id'] = this.passageUnitId;
      await this.request(`${API_BASE}/ar/quran/lessons/${this.lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      this.statusTone = 'success';
      this.statusMessage = 'Lesson saved.';
    } catch (err: any) {
      this.statusTone = 'error';
      this.statusMessage = err?.message ?? 'Failed to save lesson.';
    } finally {
      this.savingLesson = false;
    }
  }

  async createContainer() {
    if (!this.lessonId) {
      this.statusTone = 'error';
      this.statusMessage = 'Create the lesson before attaching a container.';
      return;
    }
    if (!this.selectedSurah || this.rangeStart == null) {
      this.statusTone = 'error';
      this.statusMessage = 'Select a verse range first.';
      return;
    }
    this.savingContainer = true;
    this.statusTone = 'info';
    this.statusMessage = 'Creating container + passage unit...';
    try {
      const ayahFrom = this.rangeStart;
      const ayahTo = this.rangeEnd ?? this.rangeStart;
      const rangeAyahs = this.selectedAyahs;
      const textCache = rangeAyahs.map((a) => a.text_uthmani || a.text || '').filter(Boolean).join(' ');
      const title =
        this.containerTitle.trim() ||
        `Surah ${this.selectedSurah} ${ayahFrom}-${ayahTo}`;
      const payload = {
        surah: this.selectedSurah,
        ayah_from: ayahFrom,
        ayah_to: ayahTo,
        title,
        text_cache: textCache,
      };
      const data = await this.request(`${API_BASE}/ar/quran/lessons/create`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const container = data?.result?.container;
      const units = data?.result?.units ?? [];
      const passageUnit = units.find((unit: any) => unit.unit_type === 'passage') ?? units[0];
      this.containerId = container?.id ?? null;
      this.containerTitle = container?.title ?? this.containerTitle;
      this.passageUnitId = passageUnit?.id ?? null;
      await this.saveLesson();
      this.statusTone = 'success';
      this.statusMessage = 'Container attached.';
    } catch (err: any) {
      this.statusTone = 'error';
      this.statusMessage = err?.message ?? 'Failed to create container.';
    } finally {
      this.savingContainer = false;
    }
  }
}
