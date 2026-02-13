import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AppJsonEditorModalComponent,
  AppTabsComponent,
  type AppTabItem,
} from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab } from '../../../models/editor.types';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';

@Component({
  selector: 'app-morphology-task',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent, QuranLessonTaskJsonComponent, AppJsonEditorModalComponent],
  templateUrl: './morphology-task.component.html',
})
export class MorphologyTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly tabs: AppTabItem[] = [
    { id: 'items', label: 'Word Items' },
    { id: 'json', label: 'Task JSON' },
  ];
  activeTabId: 'items' | 'json' = 'items';
  editModalOpen = false;
  editModalIndex: number | null = null;
  editModalJson = '';
  editModalError = '';
  editModalTitle = 'Morphology JSON';
  editModalPlaceholder = JSON.stringify(
    {
      word_location: '',
      surah: null,
      ayah: null,
      token_index: null,
      surface_ar: '',
      surface_norm: '',
      lemma_ar: '',
      lemma_norm: '',
      root_norm: '',
      pos: null,
      morphology: {
        singular: {
          form_ar: '',
          pattern: '',
        },
        plural: null,
        morph_features: {},
      },
      translation: {
        primary: '',
        alternatives: [],
        context: '',
      },
      lexicon_id: null,
    },
    null,
    2
  );

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'morphology') ?? null;
  }

  get items(): Array<Record<string, unknown>> {
    const tab = this.tab;
    if (!tab) return [];
    try {
      const parsed = JSON.parse(tab.json || '{}');
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      return list.filter((item: unknown) => item && typeof item === 'object') as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  get canNavigatePrev(): boolean {
    return this.editModalIndex != null && this.editModalIndex > 0;
  }

  get canNavigateNext(): boolean {
    return (
      this.editModalIndex != null &&
      this.editModalIndex >= 0 &&
      this.editModalIndex < this.items.length - 1
    );
  }

  onTabChange(tab: AppTabItem) {
    this.activeTabId = tab.id === 'json' ? 'json' : 'items';
  }

  loadFromVerses() {
    this.facade.loadMorphologyFromSelectedAyahs({ merge: true });
  }

  saveTask() {
    this.facade.saveTask('morphology');
  }

  commitLexicon() {
    const tab = this.tab;
    if (!tab) return;
    this.facade.commitMorphologyTask(tab);
  }

  trackByItem(index: number, item: Record<string, unknown>) {
    const key = typeof item['word_location'] === 'string' ? item['word_location'] : '';
    return key || index;
  }

  itemValue(item: Record<string, unknown>, key: string) {
    if (key === 'morph_pattern') {
      const direct = item[key];
      if (direct != null) return direct;
      const morphology = item['morphology'];
      if (morphology && typeof morphology === 'object' && !Array.isArray(morphology)) {
        const singular = (morphology as Record<string, unknown>)['singular'];
        if (singular && typeof singular === 'object' && !Array.isArray(singular)) {
          return (singular as Record<string, unknown>)['pattern'] ?? '';
        }
      }
      return '';
    }
    return item[key] ?? '';
  }

  updateItem(index: number, key: string, value: string) {
    const tab = this.tab;
    if (!tab) return;
    const items = this.items;
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (!item) return;
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed === '' || trimmed == null) {
      delete item[key];
    } else {
      item[key] = trimmed;
    }
    if (key === 'lemma_ar') {
      const normalized = this.normalizeArabic(String(trimmed ?? ''));
      if (normalized) {
        item['lemma_norm'] = normalized;
      }
    }
    if (key === 'root_norm') {
      const normalized = this.normalizeArabic(String(trimmed ?? ''));
      if (normalized) {
        item['root_norm'] = normalized;
      }
    }
    if (key === 'morph_pattern') {
      const morphology = this.ensureMorphologyObject(item);
      const singular = (morphology['singular'] ?? {}) as Record<string, unknown>;
      morphology['singular'] = singular;
      if (trimmed) {
        singular['pattern'] = trimmed;
      } else {
        delete singular['pattern'];
      }
      item['morphology'] = morphology;
      delete item['morph_pattern'];
    }
    this.writeItems(items);
  }

  updatePos(index: number, value: string) {
    this.updateItem(index, 'pos', value);
  }

  removeItem(index: number) {
    const tab = this.tab;
    if (!tab) return;
    const items = this.items;
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeItems(items);
  }

  openEditModal(event: Event, item: Record<string, unknown>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const items = this.items;
    const current = items[index] ?? item;
    this.setEditModalFromItem(current, index, items.length);
    queueMicrotask(() => {
      this.editModalOpen = true;
    });
  }

  openCreateModal(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.editModalIndex = -1;
    this.editModalError = '';
    this.editModalTitle = 'Add Morphology JSON';
    try {
      this.editModalJson = JSON.stringify(this.buildNewItemTemplate(), null, 2);
    } catch (err: any) {
      this.editModalError = err?.message ?? 'Failed to format JSON.';
      this.editModalJson = '';
    }
    queueMicrotask(() => {
      this.editModalOpen = true;
    });
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editModalIndex = null;
    this.editModalJson = '';
    this.editModalError = '';
  }

  submitEditModal(options: { close?: boolean } = {}) {
    if (this.editModalIndex == null) return;
    const record = this.parseModalDraft(this.editModalJson);
    if (!record) return;
    const items = this.items;
    if (this.editModalIndex < 0) {
      items.push(record);
      const nextIndex = items.length - 1;
      this.writeItems(items);
      this.setEditModalFromItem(record, nextIndex, items.length);
    } else if (this.editModalIndex < items.length) {
      items[this.editModalIndex] = record;
      this.writeItems(items);
      this.setEditModalFromItem(record, this.editModalIndex, items.length);
    }
    if (options.close) {
      this.closeEditModal();
    }
  }

  onModalPrevious(draft: string) {
    this.navigateModal(-1, draft);
  }

  onModalNext(draft: string) {
    this.navigateModal(1, draft);
  }

  private writeItems(items: Array<Record<string, unknown>>) {
    const tab = this.tab;
    if (!tab) return;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(tab.json || '{}') as Record<string, unknown>;
    } catch {
      payload = {};
    }
    payload['schema_version'] = payload['schema_version'] ?? 1;
    payload['task_type'] = 'morphology';
    payload['surah'] = this.state.selectedSurah ?? payload['surah'];
    payload['ayah_from'] = this.state.rangeStart ?? payload['ayah_from'];
    payload['ayah_to'] = this.state.rangeEnd ?? this.state.rangeStart ?? payload['ayah_to'];
    payload['items'] = items;
    tab.json = JSON.stringify(payload, null, 2);
  }

  private normalizeArabic(text: string) {
    return String(text ?? '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
  }

  private parseModalDraft(draft: string): Record<string, unknown> | null {
    let parsed: unknown;
    const trimmed = draft.trim();
    try {
      parsed = trimmed ? JSON.parse(trimmed) : {};
    } catch (err: any) {
      this.editModalError = err?.message ?? 'Invalid JSON.';
      return null;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.editModalError = 'Morphology JSON must be an object.';
      return null;
    }
    return this.ensureMorphologyDefaults(parsed as Record<string, unknown>);
  }

  private navigateModal(delta: number, draft: string) {
    if (this.editModalIndex == null || this.editModalIndex < 0) return;
    const items = this.items;
    const currentIndex = this.editModalIndex;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const record = this.parseModalDraft(draft);
    if (!record) return;
    items[currentIndex] = record;
    this.writeItems(items);

    this.setEditModalFromItem(items[nextIndex], nextIndex, items.length);
  }

  private setEditModalFromItem(
    item: Record<string, unknown>,
    index: number,
    total: number
  ) {
    this.editModalIndex = index;
    this.editModalError = '';
    this.editModalTitle = total > 0 ? `Edit Morphology JSON (${index + 1}/${total})` : 'Edit Morphology JSON';
    try {
      const normalized = this.ensureMorphologyDefaults({ ...item });
      this.editModalJson = JSON.stringify(normalized, null, 2);
    } catch (err: any) {
      this.editModalError = err?.message ?? 'Failed to format JSON.';
      this.editModalJson = '';
    }
  }

  private ensureMorphologyDefaults(record: Record<string, unknown>) {
    const next = { ...record };
    if (typeof next['lemma_ar'] === 'string' && !next['lemma_norm']) {
      const normalized = this.normalizeArabic(next['lemma_ar']);
      if (normalized) next['lemma_norm'] = normalized;
    }
    if (typeof next['root_norm'] === 'string') {
      const normalized = this.normalizeArabic(next['root_norm']);
      if (normalized) next['root_norm'] = normalized;
    }
    if (!next['word_location']) {
      const surah = Number(next['surah']);
      const ayah = Number(next['ayah']);
      const tokenIndex = Number(next['token_index']);
      if (Number.isFinite(surah) && Number.isFinite(ayah) && Number.isFinite(tokenIndex)) {
        next['word_location'] = `${surah}:${ayah}:${tokenIndex}`;
      }
    }
    const morphology = this.ensureMorphologyObject(next);
    const singular =
      morphology['singular'] && typeof morphology['singular'] === 'object' && !Array.isArray(morphology['singular'])
        ? { ...(morphology['singular'] as Record<string, unknown>) }
        : ({} as Record<string, unknown>);
    if (typeof singular['form_ar'] !== 'string') {
      singular['form_ar'] = typeof next['lemma_ar'] === 'string' ? next['lemma_ar'] : '';
    }
    if (typeof singular['pattern'] !== 'string') {
      singular['pattern'] = typeof next['morph_pattern'] === 'string' ? next['morph_pattern'] : '';
    }
    morphology['singular'] = singular;
    if (!('plural' in morphology)) {
      morphology['plural'] = null;
    }
    if (!('morph_features' in morphology)) {
      const fallback =
        next['morph_features'] && typeof next['morph_features'] === 'object' && !Array.isArray(next['morph_features'])
          ? { ...(next['morph_features'] as Record<string, unknown>) }
          : {};
      morphology['morph_features'] = fallback;
    }
    next['morphology'] = morphology;

    const translation = next['translation'];
    let translationRecord: Record<string, unknown>;
    if (typeof translation === 'string') {
      translationRecord = { primary: translation, alternatives: [], context: '' };
    } else if (translation && typeof translation === 'object' && !Array.isArray(translation)) {
      translationRecord = { ...(translation as Record<string, unknown>) };
    } else {
      translationRecord = { primary: '', alternatives: [], context: '' };
    }
    if (typeof translationRecord['primary'] !== 'string') translationRecord['primary'] = '';
    if (!Array.isArray(translationRecord['alternatives'])) translationRecord['alternatives'] = [];
    if (typeof translationRecord['context'] !== 'string') translationRecord['context'] = '';
    next['translation'] = translationRecord;

    delete next['morph_pattern'];
    delete next['morph_features'];
    return next;
  }

  private ensureMorphologyObject(record: Record<string, unknown>) {
    const existing = record['morphology'];
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return { ...(existing as Record<string, unknown>) };
    }
    return {} as Record<string, unknown>;
  }

  private buildNewItemTemplate(): Record<string, unknown> {
    const template: Record<string, unknown> = {
      word_location: '',
      surah: this.state.selectedSurah ?? null,
      ayah: this.state.rangeStart ?? null,
      token_index: null,
      surface_ar: '',
      surface_norm: '',
      lemma_ar: '',
      lemma_norm: '',
      root_norm: '',
      pos: null,
      morphology: {
        singular: {
          form_ar: '',
          pattern: '',
        },
        plural: null,
        morph_features: {},
      },
      translation: {
        primary: '',
        alternatives: [],
        context: '',
      },
      lexicon_id: null,
    };

    const items = this.items;
    const last = items.length ? items[items.length - 1] : null;
    const lastSurah = last ? Number(last['surah']) : NaN;
    const lastAyah = last ? Number(last['ayah']) : NaN;
    const lastToken = last ? Number(last['token_index']) : NaN;
    if (Number.isFinite(lastSurah)) template['surah'] = lastSurah;
    if (Number.isFinite(lastAyah)) template['ayah'] = lastAyah;
    if (Number.isFinite(lastToken)) {
      const nextToken = lastToken + 1;
      template['token_index'] = nextToken;
      if (Number.isFinite(template['surah']) && Number.isFinite(template['ayah'])) {
        template['word_location'] = `${template['surah']}:${template['ayah']}:${nextToken}`;
      }
    }

    return template;
  }
}
