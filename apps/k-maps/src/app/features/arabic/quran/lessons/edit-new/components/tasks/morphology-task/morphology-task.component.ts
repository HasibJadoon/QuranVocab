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

type ModalKind = 'items' | 'evidence' | 'links';

@Component({
  selector: 'app-morphology-task',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent, AppJsonEditorModalComponent],
  templateUrl: './morphology-task.component.html',
})
export class MorphologyTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly tabs: AppTabItem[] = [
    { id: 'items', label: 'Current' },
    { id: 'evidence', label: 'Lexicon Evidence' },
    { id: 'links', label: 'Lexicon Morphology' },
  ];
  activeTabId: ModalKind = 'items';

  editModalOpen = false;
  editModalIndex: number | null = null;
  editModalKind: ModalKind = 'items';
  editModalJson = '';
  editModalError = '';
  editModalTitle = 'Morphology JSON';
  editModalPlaceholder = '';
  rowEvidenceMorphologyModal = false;

  constructor() {
    this.editModalPlaceholder = this.placeholderFor('items');
  }

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'morphology') ?? null;
  }

  get items(): Array<Record<string, unknown>> {
    return this.readRecordArray('items');
  }

  get evidenceItems(): Array<Record<string, unknown>> {
    return this.readRecordArray('lexicon_evidence');
  }

  get lexiconMorphologyItems(): Array<Record<string, unknown>> {
    return this.readRecordArray('lexicon_morphology');
  }

  get canNavigatePrev(): boolean {
    return this.editModalIndex != null && this.editModalIndex > 0;
  }

  get canNavigateNext(): boolean {
    const current = this.activeModalItems();
    return (
      this.editModalIndex != null &&
      this.editModalIndex >= 0 &&
      this.editModalIndex < current.length - 1
    );
  }

  onTabChange(tab: AppTabItem) {
    if (tab.id === 'evidence') {
      this.activeTabId = 'evidence';
      return;
    }
    if (tab.id === 'links') {
      this.activeTabId = 'links';
      return;
    }
    this.activeTabId = 'items';
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

  trackByEvidence(index: number, item: Record<string, unknown>) {
    const key = typeof item['evidence_id'] === 'string' ? item['evidence_id'] : '';
    if (key) return key;
    const lexicon = typeof item['ar_u_lexicon'] === 'string' ? item['ar_u_lexicon'] : '';
    const chunk = typeof item['chunk_id'] === 'string' ? item['chunk_id'] : '';
    return `${lexicon}|${chunk}|${index}`;
  }

  trackByLink(index: number, item: Record<string, unknown>) {
    const lexicon = typeof item['ar_u_lexicon'] === 'string' ? item['ar_u_lexicon'] : '';
    const morph = typeof item['ar_u_morphology'] === 'string' ? item['ar_u_morphology'] : '';
    if (lexicon || morph) return `${lexicon}|${morph}`;
    return index;
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
    const items = this.items;
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeItems(items);
  }

  removeEvidence(index: number) {
    const items = this.evidenceItems;
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeEvidence(items);
  }

  removeLexiconMorphology(index: number) {
    const items = this.lexiconMorphologyItems;
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeLexiconMorphology(items);
  }

  addEvidenceAndMorphologyFromItem(event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const items = this.items;
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (!item) return;

    const payload: Record<string, unknown> = {
      evidences: this.buildEvidenceEntriesFromItem(item),
      morphology: this.buildMorphologyLinkFromItem(item),
    };

    this.rowEvidenceMorphologyModal = true;
    this.editModalKind = 'items';
    this.editModalIndex = null;
    this.editModalError = '';
    this.editModalTitle = 'Attach Evidences JSON';
    this.editModalPlaceholder = JSON.stringify(
      {
        evidences: [this.ensureEvidenceDefaults(this.buildTemplate('evidence'))],
        morphology: this.ensureLexiconMorphologyDefaults(this.buildTemplate('links')),
      },
      null,
      2
    );
    this.editModalJson = JSON.stringify(payload, null, 2);
    queueMicrotask(() => {
      this.editModalOpen = true;
    });
  }

  openEditModal(event: Event, item: Record<string, unknown>, index: number, kind: ModalKind = 'items') {
    event.preventDefault();
    event.stopPropagation();
    const items = this.itemsByKind(kind);
    const current = items[index] ?? item;
    this.setEditModalFromItem(current, index, items.length, kind);
    queueMicrotask(() => {
      this.editModalOpen = true;
    });
  }

  openCreateModal(event: Event, kind: ModalKind = 'items') {
    event.preventDefault();
    event.stopPropagation();
    this.editModalKind = kind;
    this.editModalIndex = -1;
    this.editModalError = '';
    this.editModalTitle = this.modalTitle(kind, true);
    this.editModalPlaceholder = this.placeholderFor(kind);
    try {
      this.editModalJson = JSON.stringify(this.buildTemplate(kind), null, 2);
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
    this.rowEvidenceMorphologyModal = false;
  }

  onModalSave(draft: string) {
    this.editModalJson = draft;
    if (this.rowEvidenceMorphologyModal) {
      this.submitRowEvidenceMorphologyModal({ close: true });
      return;
    }
    this.submitEditModal();
  }

  submitEditModal(options: { close?: boolean } = {}) {
    if (this.editModalIndex == null) return;
    const record = this.parseModalDraft(this.editModalJson);
    if (!record) return;

    const items = this.activeModalItems();
    if (this.editModalIndex < 0) {
      items.push(record);
      const nextIndex = items.length - 1;
      this.writeActiveModalItems(items);
      this.setEditModalFromItem(record, nextIndex, items.length, this.editModalKind);
    } else if (this.editModalIndex < items.length) {
      items[this.editModalIndex] = record;
      this.writeActiveModalItems(items);
      this.setEditModalFromItem(record, this.editModalIndex, items.length, this.editModalKind);
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

  private modalTitle(kind: ModalKind, create = false): string {
    if (kind === 'evidence') return create ? 'Add Lexicon Evidence JSON' : 'Edit Lexicon Evidence JSON';
    if (kind === 'links') return create ? 'Add Lexicon Morphology Link JSON' : 'Edit Lexicon Morphology Link JSON';
    return create ? 'Add Morphology JSON' : 'Edit Morphology JSON';
  }

  private placeholderFor(kind: ModalKind): string {
    if (kind === 'evidence') {
      return JSON.stringify(
        {
          ar_u_lexicon: null,
          locator_type: 'chunk',
          source_type: 'book',
          source_id: '',
          chunk_id: '',
          page_no: null,
          heading_raw: '',
          heading_norm: '',
          url: null,
          app_payload_json: null,
          link_role: 'supports',
          evidence_kind: 'lexical',
          evidence_strength: 'supporting',
          extract_text: '',
          note_md: '',
          meta: {},
        },
        null,
        2
      );
    }
    if (kind === 'links') {
      return JSON.stringify(
        {
          ar_u_lexicon: null,
          ar_u_morphology: null,
          link_role: 'primary',
          // optional morphology payload to create ar_u_morphology when missing
          surface_ar: '',
          surface_norm: '',
          pos2: 'noun',
          derivation_type: null,
          noun_number: null,
          verb_form: null,
          derived_from_verb_form: null,
          derived_pattern: null,
          transitivity: null,
          obj_count: null,
          tags_ar: null,
          tags_en: null,
          notes: null,
          meta: null,
        },
        null,
        2
      );
    }
    return JSON.stringify(
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
  }

  private readRecordArray(key: 'items' | 'lexicon_evidence' | 'lexicon_morphology'): Array<Record<string, unknown>> {
    const payload = this.parseTaskPayload();
    const list = Array.isArray(payload[key]) ? payload[key] : [];
    return list.filter((item: unknown) => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }

  private parseTaskPayload(): Record<string, unknown> {
    const tab = this.tab;
    if (!tab) return {};
    try {
      const parsed = JSON.parse(tab.json || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  private writeTaskPayload(payload: Record<string, unknown>) {
    const tab = this.tab;
    if (!tab) return;
    payload['schema_version'] = payload['schema_version'] ?? 1;
    payload['task_type'] = 'morphology';
    payload['surah'] = this.state.selectedSurah ?? payload['surah'];
    payload['ayah_from'] = this.state.rangeStart ?? payload['ayah_from'];
    payload['ayah_to'] = this.state.rangeEnd ?? this.state.rangeStart ?? payload['ayah_to'];
    tab.json = JSON.stringify(payload, null, 2);
  }

  private writeItems(items: Array<Record<string, unknown>>) {
    const payload = this.parseTaskPayload();
    payload['items'] = items;
    this.writeTaskPayload(payload);
  }

  private writeEvidence(items: Array<Record<string, unknown>>) {
    const payload = this.parseTaskPayload();
    payload['lexicon_evidence'] = items;
    this.writeTaskPayload(payload);
  }

  private writeLexiconMorphology(items: Array<Record<string, unknown>>) {
    const payload = this.parseTaskPayload();
    payload['lexicon_morphology'] = items;
    this.writeTaskPayload(payload);
  }

  private itemsByKind(kind: ModalKind): Array<Record<string, unknown>> {
    if (kind === 'evidence') return this.evidenceItems;
    if (kind === 'links') return this.lexiconMorphologyItems;
    return this.items;
  }

  private activeModalItems(): Array<Record<string, unknown>> {
    return this.itemsByKind(this.editModalKind);
  }

  private writeActiveModalItems(items: Array<Record<string, unknown>>) {
    if (this.editModalKind === 'evidence') {
      this.writeEvidence(items);
      return;
    }
    if (this.editModalKind === 'links') {
      this.writeLexiconMorphology(items);
      return;
    }
    this.writeItems(items);
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
      this.editModalError = 'JSON must be an object.';
      return null;
    }

    if (this.editModalKind === 'evidence') {
      return this.ensureEvidenceDefaults(parsed as Record<string, unknown>);
    }
    if (this.editModalKind === 'links') {
      return this.ensureLexiconMorphologyDefaults(parsed as Record<string, unknown>);
    }
    return this.ensureMorphologyDefaults(parsed as Record<string, unknown>);
  }

  private submitRowEvidenceMorphologyModal(options: { close?: boolean } = {}) {
    let parsed: unknown;
    const trimmed = this.editModalJson.trim();
    try {
      parsed = trimmed ? JSON.parse(trimmed) : {};
    } catch (err: any) {
      this.editModalError = err?.message ?? 'Invalid JSON.';
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.editModalError = 'JSON must be an object with evidences[] and morphology.';
      return;
    }

    const payload = parsed as Record<string, unknown>;
    const rawEvidences = payload['evidences'];
    const evidenceCandidates = Array.isArray(rawEvidences)
      ? rawEvidences
          .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
          .map((entry) => this.ensureEvidenceDefaults(entry))
      : [];
    if (evidenceCandidates.length) {
      const currentEvidence = [...this.evidenceItems];
      const seenEvidence = new Set(currentEvidence.map((entry) => this.evidenceKey(entry)));
      for (const candidate of evidenceCandidates) {
        const key = this.evidenceKey(candidate);
        if (seenEvidence.has(key)) continue;
        seenEvidence.add(key);
        currentEvidence.push(candidate);
      }
      this.writeEvidence(currentEvidence);
    }

    const rawMorphology = payload['morphology'];
    if (rawMorphology && typeof rawMorphology === 'object' && !Array.isArray(rawMorphology)) {
      const link = this.ensureLexiconMorphologyDefaults(rawMorphology as Record<string, unknown>);
      const currentLinks = [...this.lexiconMorphologyItems];
      const seenLinks = new Set(currentLinks.map((entry) => this.lexiconMorphologyKey(entry)));
      const linkKey = this.lexiconMorphologyKey(link);
      if (!seenLinks.has(linkKey)) {
        currentLinks.push(link);
        this.writeLexiconMorphology(currentLinks);
      }
    }

    if (options.close) {
      this.closeEditModal();
    }
  }

  private navigateModal(delta: number, draft: string) {
    if (this.editModalIndex == null || this.editModalIndex < 0) return;
    const items = this.activeModalItems();
    const currentIndex = this.editModalIndex;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const record = this.parseModalDraft(draft);
    if (!record) return;
    items[currentIndex] = record;
    this.writeActiveModalItems(items);

    this.setEditModalFromItem(items[nextIndex], nextIndex, items.length, this.editModalKind);
  }

  private setEditModalFromItem(
    item: Record<string, unknown>,
    index: number,
    total: number,
    kind: ModalKind
  ) {
    this.editModalKind = kind;
    this.editModalIndex = index;
    this.editModalError = '';
    this.editModalTitle = total > 0 ? `${this.modalTitle(kind)} (${index + 1}/${total})` : this.modalTitle(kind);
    this.editModalPlaceholder = this.placeholderFor(kind);
    try {
      let normalized: Record<string, unknown>;
      if (kind === 'evidence') {
        normalized = this.ensureEvidenceDefaults({ ...item });
      } else if (kind === 'links') {
        normalized = this.ensureLexiconMorphologyDefaults({ ...item });
      } else {
        normalized = this.ensureMorphologyDefaults({ ...item });
      }
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

  private buildEvidenceEntriesFromItem(item: Record<string, unknown>): Array<Record<string, unknown>> {
    const lexiconId = this.getLexiconId(item);
    const wordLocation = this.textValue(item['word_location']);
    const surah = this.numberValue(item['surah']);
    const ayah = this.numberValue(item['ayah']);
    const tokenIndex = this.numberValue(item['token_index']);
    const surfaceAr = this.textValue(item['surface_ar']);
    const lemmaAr = this.textValue(item['lemma_ar']);
    const headingRaw = surah !== null && ayah !== null ? `Surah ${surah}:${ayah}` : '';
    const rowMeta = {
      source: 'morphology-row-action',
      word_location: wordLocation || null,
      surah,
      ayah,
      token_index: tokenIndex,
    };

    const rawEvidences = item['evidences'];
    if (Array.isArray(rawEvidences)) {
      return rawEvidences
        .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
        .map((entry) =>
          this.ensureEvidenceDefaults({
            ...entry,
            ar_u_lexicon: this.textValue(entry['ar_u_lexicon']) || this.textValue(entry['lexicon_id']) || lexiconId || null,
            word_location: this.textValue(entry['word_location']) || wordLocation || null,
            heading_raw: this.textValue(entry['heading_raw']) || headingRaw,
            extract_text: this.textValue(entry['extract_text']) || surfaceAr || lemmaAr,
            note_md: this.textValue(entry['note_md']) || '',
            meta: this.mergeMeta(entry['meta'], rowMeta),
          })
        );
    }

    return [
      this.ensureEvidenceDefaults({
        ar_u_lexicon: lexiconId || null,
        word_location: wordLocation || null,
        locator_type: 'chunk',
        source_type: 'book',
        source_id: '',
        chunk_id: '',
        page_no: null,
        heading_raw: headingRaw,
        heading_norm: '',
        link_role: 'supports',
        evidence_kind: 'lexical',
        evidence_strength: 'supporting',
        extract_text: surfaceAr || lemmaAr,
        note_md: '',
        meta: rowMeta,
      }),
    ];
  }

  private buildMorphologyLinkFromItem(item: Record<string, unknown>): Record<string, unknown> {
    const lexiconId = this.getLexiconId(item);
    const wordLocation = this.textValue(item['word_location']);
    const surfaceAr = this.textValue(item['surface_ar']) || this.textValue(item['lemma_ar']);
    const surfaceNorm = this.textValue(item['surface_norm']) || this.normalizeArabic(surfaceAr);
    const posRaw = this.textValue(item['pos']).toLowerCase();
    const pos2 =
      posRaw === 'verb' || posRaw === 'noun' || posRaw === 'adj' || posRaw === 'particle' || posRaw === 'phrase'
        ? posRaw
        : 'noun';

    const link = this.ensureLexiconMorphologyDefaults({
      ar_u_lexicon: lexiconId || null,
      ar_u_morphology: this.textValue(item['ar_u_morphology']) || null,
      word_location: wordLocation || null,
      link_role: 'primary',
      surface_ar: surfaceAr,
      surface_norm: surfaceNorm,
      pos2,
      meta: {
        source: 'morphology-row-action',
      },
    });
    return link;
  }

  private evidenceKey(entry: Record<string, unknown>): string {
    const evidenceId = this.textValue(entry['evidence_id']);
    if (evidenceId) return `id:${evidenceId}`;
    const lexiconId = this.textValue(entry['ar_u_lexicon']) || this.textValue(entry['lexicon_id']);
    const wordLocation = this.textValue(entry['word_location']);
    const sourceId = this.textValue(entry['source_id']);
    const chunkId = this.textValue(entry['chunk_id']);
    const url = this.textValue(entry['url']);
    const extract = this.textValue(entry['extract_text']);
    return `sig:${lexiconId}|${wordLocation}|${sourceId}|${chunkId}|${url}|${extract}`;
  }

  private lexiconMorphologyKey(entry: Record<string, unknown>): string {
    const lexiconId = this.textValue(entry['ar_u_lexicon']) || this.textValue(entry['lexicon_id']);
    const morphId = this.textValue(entry['ar_u_morphology']);
    const wordLocation = this.textValue(entry['word_location']);
    const surfaceNorm = this.textValue(entry['surface_norm']);
    return `sig:${lexiconId}|${morphId}|${wordLocation}|${surfaceNorm}`;
  }

  private getLexiconId(item: Record<string, unknown>): string {
    return this.textValue(item['ar_u_lexicon']) || this.textValue(item['lexicon_id']) || '';
  }

  private textValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private numberValue(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private mergeMeta(current: unknown, extra: Record<string, unknown>): Record<string, unknown> {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
    return { ...base, ...extra };
  }

  private ensureEvidenceDefaults(record: Record<string, unknown>) {
    const next = { ...record };
    if (!next['locator_type']) next['locator_type'] = 'chunk';
    if (!next['source_type']) next['source_type'] = 'book';
    if (!next['link_role']) next['link_role'] = 'supports';
    if (!next['evidence_kind']) next['evidence_kind'] = 'lexical';
    if (!next['evidence_strength']) next['evidence_strength'] = 'supporting';
    if (!Object.prototype.hasOwnProperty.call(next, 'page_no')) next['page_no'] = null;
    if (!Object.prototype.hasOwnProperty.call(next, 'source_id')) next['source_id'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'chunk_id')) next['chunk_id'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'url')) next['url'] = null;
    if (!Object.prototype.hasOwnProperty.call(next, 'extract_text')) next['extract_text'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'note_md')) next['note_md'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'meta')) next['meta'] = {};
    return next;
  }

  private ensureLexiconMorphologyDefaults(record: Record<string, unknown>) {
    const next = { ...record };
    if (!next['link_role']) next['link_role'] = 'primary';
    if (!Object.prototype.hasOwnProperty.call(next, 'ar_u_lexicon')) next['ar_u_lexicon'] = null;
    if (!Object.prototype.hasOwnProperty.call(next, 'ar_u_morphology')) next['ar_u_morphology'] = null;
    if (!Object.prototype.hasOwnProperty.call(next, 'surface_ar')) next['surface_ar'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'surface_norm')) next['surface_norm'] = '';
    if (!Object.prototype.hasOwnProperty.call(next, 'pos2')) next['pos2'] = 'noun';
    return next;
  }

  private ensureMorphologyObject(record: Record<string, unknown>) {
    const existing = record['morphology'];
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return { ...(existing as Record<string, unknown>) };
    }
    return {} as Record<string, unknown>;
  }

  private buildTemplate(kind: ModalKind): Record<string, unknown> {
    if (kind === 'evidence') {
      return this.ensureEvidenceDefaults({
        ar_u_lexicon: null,
        locator_type: 'chunk',
        source_type: 'book',
        source_id: '',
        chunk_id: '',
        page_no: null,
        heading_raw: '',
        heading_norm: '',
        url: null,
        app_payload_json: null,
        link_role: 'supports',
        evidence_kind: 'lexical',
        evidence_strength: 'supporting',
        extract_text: '',
        note_md: '',
        meta: {},
      });
    }

    if (kind === 'links') {
      return this.ensureLexiconMorphologyDefaults({
        ar_u_lexicon: null,
        ar_u_morphology: null,
        link_role: 'primary',
        surface_ar: '',
        surface_norm: '',
        pos2: 'noun',
        derivation_type: null,
        noun_number: null,
        verb_form: null,
        derived_from_verb_form: null,
        derived_pattern: null,
        transitivity: null,
        obj_count: null,
        tags_ar: null,
        tags_en: null,
        notes: null,
        meta: null,
      });
    }

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
