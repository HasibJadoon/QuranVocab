import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LessonBuilderHeaderComponent } from '../../../quran/lessons/edit/components/lesson-builder-header.component';
import { LessonBuilderTabsComponent } from '../../../quran/lessons/edit/components/lesson-builder-tabs.component';
import { BuilderTab, BuilderTabId, BuilderTabState } from '../../../quran/lessons/edit/components/lesson-builder.types';
import {
  LiteratureLessonDraft,
  LiteratureLessonService,
} from '../../../../../shared/services/literature-lesson.service';

type LiteratureLesson = {
  id?: number;
  title: string;
  title_ar?: string;
  lesson_type: 'literature';
  subtype?: string;
  source?: string | null;
  status?: string;
  difficulty?: number | null;
  reference?: {
    ref_label?: string;
    citation?: string;
  };
};

type LiteratureUnit = {
  id?: string | null;
  unit_type: string;
  order_index: number;
  start_ref?: string | null;
  end_ref?: string | null;
  text_cache?: string | null;
  meta_json?: Record<string, unknown> | null;
};

type SaveStatusTone = 'info' | 'success' | 'error';

const BUILDER_TABS: BuilderTab[] = [
  { id: 'meta', label: 'Lesson Info', intent: 'Define lesson metadata' },
  { id: 'container', label: 'Container', intent: 'Create literature container' },
  { id: 'units', label: 'Container Units', intent: 'Attach segments / passages' },
];

@Component({
  selector: 'app-literature-lesson-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LessonBuilderHeaderComponent, LessonBuilderTabsComponent],
  templateUrl: './literature-lesson-editor.component.html',
  styleUrls: ['./literature-lesson-editor.component.scss'],
})
export class LiteratureLessonEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(LiteratureLessonService);

  lesson: LiteratureLesson = {
    title: '',
    title_ar: '',
    lesson_type: 'literature',
    subtype: '',
    source: '',
    status: 'draft',
    difficulty: 1,
    reference: {},
  };

  units: LiteratureUnit[] = [];

  containerForm = {
    containerKey: '',
    title: '',
  };

  tabs = BUILDER_TABS;
  activeTabId: BuilderTabId = 'meta';
  isSaving = false;
  saveStatusMessage = '';
  saveStatusTone: SaveStatusTone = 'info';

  draftId: string | null = null;
  draftVersion: number | null = null;
  lessonId: number | null = null;
  isNewLesson = true;

  ngOnInit() {
    this.initialize();
  }

  get activeTabIndex() {
    return this.tabs.findIndex((tab) => tab.id === this.activeTabId);
  }

  get activeTabIntent() {
    return this.tabs.find((tab) => tab.id === this.activeTabId)?.intent ?? '';
  }

  get tabStatuses(): Partial<Record<BuilderTabId, BuilderTabState>> {
    return {
      meta: this.lesson.title.trim() ? 'done' : 'ready',
      container: this.containerForm.containerKey.trim() ? 'done' : 'ready',
      units: this.units.length ? 'done' : 'ready',
    };
  }

  get computedContainerId() {
    const key = this.containerForm.containerKey.trim();
    if (!key) return '';
    return `C:LITERATURE:${key.toUpperCase()}`;
  }

  get primaryUnitId() {
    const first = this.units[0];
    if (!first) return '';
    if (first.id) return first.id;
    const base = this.computedContainerId || 'C:LITERATURE';
    return `${base}:unit:${first.order_index ?? 0}`;
  }

  async initialize() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const lessonId = idParam ? Number(idParam) : null;
    if (lessonId && Number.isFinite(lessonId)) {
      await this.loadLesson(lessonId);
    } else {
      this.isNewLesson = true;
      this.lessonId = null;
    }

    await this.ensureDraft();
  }

  async loadLesson(lessonId: number) {
    try {
      const lesson = await firstValueFrom(this.service.getLesson(lessonId));
      this.lessonId = Number(lesson?.id ?? lessonId);
      this.isNewLesson = false;
      this.lesson.title = String(lesson?.title ?? '');
      this.lesson.title_ar = (lesson?.title_ar as string) ?? '';
      this.lesson.subtype = (lesson?.subtype as string) ?? '';
      this.lesson.source = (lesson?.source as string) ?? '';
      this.lesson.status = (lesson?.status as string) ?? 'draft';
      this.lesson.difficulty = (lesson?.difficulty as number) ?? 1;
      this.lesson.reference = (lesson?.reference as LiteratureLesson['reference']) ?? {};

      const lessonJson = this.asRecord(lesson?.lesson_json) ?? {};
      const reference = this.asRecord(lessonJson['reference']) ?? {};
      this.lesson.reference = {
        ref_label: (reference['ref_label'] as string) ?? this.lesson.reference?.ref_label ?? '',
        citation: (reference['citation'] as string) ?? this.lesson.reference?.citation ?? '',
      };

      const containerId = this.asString(reference['container_id']);
      if (containerId) {
        this.containerForm.containerKey = this.parseContainerKey(containerId);
      }
      this.containerForm.title = this.asString(reference['container_title']) ?? this.containerForm.title;

      const units = Array.isArray(lessonJson['units']) ? lessonJson['units'] : [];
      this.units = units.map((unit: any, index: number) => ({
        id: this.asString(unit?.id ?? unit?.unit_id) ?? null,
        unit_type: this.asString(unit?.unit_type) ?? 'segment',
        order_index: Number.isFinite(unit?.order_index) ? unit.order_index : index,
        start_ref: this.asString(unit?.start_ref) ?? null,
        end_ref: this.asString(unit?.end_ref) ?? null,
        text_cache: this.asString(unit?.text_cache) ?? null,
        meta_json: (this.asRecord(unit?.meta_json) ?? null) as Record<string, unknown> | null,
      }));
    } catch {
      this.setSaveStatus('Unable to load lesson. Starting a fresh draft.', 'error');
      this.isNewLesson = true;
      this.lessonId = null;
    }
  }

  async ensureDraft() {
    if (this.draftId) return;
    const storedKey = this.lessonId ? `km:lit-lesson:draft:${this.lessonId}` : 'km:lit-lesson:draft:new';
    const storedDraftId = localStorage.getItem(storedKey);
    if (storedDraftId) {
      try {
        const draft = await firstValueFrom(this.service.getDraft(storedDraftId));
        this.draftId = draft.draft_id;
        this.draftVersion = draft.draft_version;
        this.applyDraftJson(draft.draft_json);
        return;
      } catch {
        localStorage.removeItem(storedKey);
      }
    }

    const created = await firstValueFrom(
      this.service.createDraft({
        lesson_id: this.lessonId ?? undefined,
        active_step: this.activeTabId,
      })
    );
    this.draftId = created.draft_id;
    this.draftVersion = created.draft_version;
    localStorage.setItem(storedKey, created.draft_id);

    if (!this.isNewLesson) {
      const updated = await firstValueFrom(
        this.service.updateDraft(created.draft_id, {
          draft_json: this.buildDraftJson(),
          active_step: this.activeTabId,
        })
      );
      this.draftVersion = updated.draft_version;
    }
  }

  async save() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.setSaveStatus('Saving draft...', 'info');

    try {
      await this.ensureDraft();
      if (!this.draftId) {
        this.setSaveStatus('Draft not initialized.', 'error');
        return;
      }

      const updated = await firstValueFrom(
        this.service.updateDraft(this.draftId, {
          draft_json: this.buildDraftJson(),
          active_step: this.activeTabId,
        })
      );
      this.draftVersion = updated.draft_version;

      await this.commitActiveStep();
    } catch (error: any) {
      this.setSaveStatus(error?.message ?? 'Save failed.', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async commitActiveStep() {
    if (!this.draftId || this.draftVersion == null) return;

    if (this.activeTabId === 'meta') {
      if (!this.lesson.title.trim()) {
        this.setSaveStatus('Saved draft locally. Add a title to commit meta.', 'success');
        return;
      }

      const response = await firstValueFrom(
        this.service.commitDraft(this.draftId, {
          step: 'meta',
          draft_version: this.draftVersion,
        })
      );

      if (response.lesson_id && this.isNewLesson) {
        this.lessonId = response.lesson_id;
        this.isNewLesson = false;
        localStorage.removeItem('km:lit-lesson:draft:new');
        if (this.draftId) {
          localStorage.setItem(`km:lit-lesson:draft:${response.lesson_id}`, this.draftId);
        }
        this.router.navigate(['/arabic/literature/lessons', response.lesson_id, 'edit'], {
          replaceUrl: true,
        });
      }

      this.setSaveStatus('Lesson meta committed.', 'success');
      return;
    }

    const lessonId = this.lessonId;
    if (!lessonId) {
      this.setSaveStatus('Save meta first to create the lesson.', 'error');
      return;
    }

    if (this.activeTabId === 'container') {
      if (!this.containerForm.containerKey.trim()) {
        this.setSaveStatus('Container key is required.', 'error');
        return;
      }

      await firstValueFrom(
        this.service.commitStep(lessonId, {
          step: 'container',
          container_id: this.computedContainerId,
          payload: {
            container: {
              container_type: 'literature',
              container_key: this.containerForm.containerKey.trim(),
              title: this.containerForm.title.trim() || null,
            },
          },
        })
      );
      this.setSaveStatus('Container committed.', 'success');
      return;
    }

    if (this.activeTabId === 'units') {
      if (!this.units.length) {
        this.setSaveStatus('Add at least one unit.', 'error');
        return;
      }
      if (!this.computedContainerId) {
        this.setSaveStatus('Container key is required before saving units.', 'error');
        return;
      }

      await firstValueFrom(
        this.service.commitStep(lessonId, {
          step: 'units',
          container_id: this.computedContainerId,
          payload: {
            units: this.units.map((unit) => ({
              id: unit.id ?? undefined,
              unit_type: unit.unit_type,
              order_index: unit.order_index,
              start_ref: unit.start_ref ?? null,
              end_ref: unit.end_ref ?? null,
              text_cache: unit.text_cache ?? null,
              meta_json: unit.meta_json ?? null,
            })),
          },
        })
      );

      await firstValueFrom(
        this.service.commitDraft(this.draftId, {
          step: 'units',
          draft_version: this.draftVersion,
        })
      );

      this.setSaveStatus('Units committed.', 'success');
    }
  }

  back() {
    this.router.navigate(['/arabic/literature/lessons']);
  }

  openView() {
    if (!this.lessonId) return;
    this.router.navigate(['/arabic/literature/lessons', this.lessonId, 'view']);
  }

  selectTab(tabId: BuilderTabId) {
    this.activeTabId = tabId;
  }

  addUnit() {
    const nextOrder = this.units.length;
    this.units = [
      ...this.units,
      {
        id: null,
        unit_type: 'segment',
        order_index: nextOrder,
        start_ref: null,
        end_ref: null,
        text_cache: null,
        meta_json: null,
      },
    ];
  }

  removeUnit(index: number) {
    this.units = this.units.filter((_, idx) => idx !== index);
    this.units = this.units.map((unit, idx) => ({ ...unit, order_index: idx }));
  }

  trackByUnit = (_index: number, unit: LiteratureUnit) => unit.id ?? `${unit.order_index}`;

  private buildDraftJson(): LiteratureLessonDraft['draft_json'] {
    return {
      schema_version: 1,
      meta: {
        title: this.lesson.title ?? '',
        title_ar: this.lesson.title_ar ?? null,
        lesson_type: 'literature',
        subtype: this.lesson.subtype ?? null,
        difficulty: this.lesson.difficulty ?? null,
        source: this.lesson.source ?? null,
        status: this.lesson.status ?? 'draft',
      },
      reference: {
        container_id: this.computedContainerId || null,
        container_key: this.containerForm.containerKey || null,
        unit_id: this.primaryUnitId || null,
        ref_label: this.lesson.reference?.ref_label ?? null,
        citation: this.lesson.reference?.citation ?? null,
      },
      units: this.units.map((unit) => ({
        id: unit.id ?? null,
        unit_type: unit.unit_type,
        order_index: unit.order_index,
        start_ref: unit.start_ref ?? null,
        end_ref: unit.end_ref ?? null,
        text_cache: unit.text_cache ?? null,
        meta_json: unit.meta_json ?? null,
      })),
      sentences: [],
      comprehension: {},
      notes: [],
    };
  }

  private applyDraftJson(draftJson: Record<string, unknown>) {
    const meta = this.asRecord(draftJson['meta']) ?? {};
    const reference = this.asRecord(draftJson['reference']) ?? {};

    this.lesson.title = String(meta['title'] ?? this.lesson.title ?? '');
    this.lesson.title_ar = (meta['title_ar'] as string) ?? this.lesson.title_ar ?? '';
    this.lesson.subtype = (meta['subtype'] as string) ?? this.lesson.subtype ?? '';
    this.lesson.source = (meta['source'] as string) ?? this.lesson.source ?? '';
    this.lesson.status = (meta['status'] as string) ?? this.lesson.status ?? 'draft';
    this.lesson.difficulty = (meta['difficulty'] as number) ?? this.lesson.difficulty ?? 1;

    this.lesson.reference = {
      ref_label: (reference['ref_label'] as string) ?? this.lesson.reference?.ref_label ?? '',
      citation: (reference['citation'] as string) ?? this.lesson.reference?.citation ?? '',
    };

    const containerKey = this.asString(reference['container_key']);
    if (containerKey) {
      this.containerForm.containerKey = containerKey;
    } else {
      const containerId = this.asString(reference['container_id']);
      if (containerId) {
        this.containerForm.containerKey = this.parseContainerKey(containerId);
      }
    }

    if (Array.isArray(draftJson['units'])) {
      this.units = draftJson['units'].map((unit: any, index: number) => ({
        id: this.asString(unit?.id ?? unit?.unit_id) ?? null,
        unit_type: this.asString(unit?.unit_type) ?? 'segment',
        order_index: Number.isFinite(unit?.order_index) ? unit.order_index : index,
        start_ref: this.asString(unit?.start_ref) ?? null,
        end_ref: this.asString(unit?.end_ref) ?? null,
        text_cache: this.asString(unit?.text_cache) ?? null,
        meta_json: (this.asRecord(unit?.meta_json) ?? null) as Record<string, unknown> | null,
      }));
    }
  }

  private parseContainerKey(containerId: string) {
    const parts = containerId.split(':');
    if (parts.length <= 2) return containerId;
    return parts.slice(2).join(':').toLowerCase();
  }

  private setSaveStatus(message: string, tone: SaveStatusTone) {
    this.saveStatusMessage = message;
    this.saveStatusTone = tone;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private asString(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
