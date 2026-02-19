import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';

import {
  QuranLexiconBundle,
  QuranLexiconDataService,
  QuranLexiconEvidenceRow,
  QuranLexiconMorphologyLink,
  QuranMorphologyDetail,
} from '../../services/quran-lexicon-data.service';

export type QuranWordInspectorTab = 'lexicon' | 'morphology' | 'evidence';

export interface QuranWordInspectorSelection {
  text: string;
  location: string;
  surah?: number | null;
  ayah?: number | null;
  tokenIndex?: number | null;
}

type WordLocationParts = {
  surah: number | null;
  ayah: number | null;
  tokenIndex: number | null;
};

type InspectorField = {
  id: string;
  label: string;
  value: string;
  arabic?: boolean;
};

type MorphologyFeature = {
  id: string;
  key: string;
  value: string;
};

@Component({
  selector: 'app-quran-word-inspector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quran-word-inspector.component.html',
  styleUrls: ['./quran-word-inspector.component.scss'],
})
export class QuranWordInspectorComponent implements OnChanges {
  private readonly lexiconData = inject(QuranLexiconDataService);

  @Input() selection: QuranWordInspectorSelection | null = null;
  @Input() contextLabel = '';
  @Input() morphologyItems: Array<Record<string, unknown>> = [];
  @Input() lexiconMorphologyItems: Array<Record<string, unknown>> = [];
  @Input() evidenceItems: Array<Record<string, unknown>> = [];
  @Output() close = new EventEmitter<void>();

  activeTab: QuranWordInspectorTab = 'lexicon';
  remoteLoading = false;
  remoteError = '';
  resolvedLexiconId = '';

  private readonly arabicDiacriticsRe = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
  private selectedMorphologyRecord: Record<string, unknown> | null = null;
  private selectedLinkRecord: Record<string, unknown> | null = null;
  private selectedEvidenceRecords: Array<Record<string, unknown>> = [];
  private remoteBundle: QuranLexiconBundle | null = null;
  private remoteLexiconId = '';
  private remoteSequence = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selection']) {
      this.activeTab = 'lexicon';
    }
    this.recomputeSelectionDetails();
  }

  get hasSelection(): boolean {
    return Boolean(this.selection?.text?.trim());
  }

  get activeWord(): string {
    return this.selection?.text?.trim() || '—';
  }

  get activeLocation(): string {
    return this.selection?.location?.trim() || '—';
  }

  get activeReferenceLabel(): string {
    if (!this.selection) return this.activeLocation;
    const fromSelection = this.formatRefFromSelection(this.selection);
    if (fromSelection) return fromSelection;
    const parsed = this.parseLocation(this.selection.location, this.selection);
    if (parsed.surah == null || parsed.ayah == null) return this.activeLocation;
    const tokenPart = parsed.tokenIndex == null ? '' : `:${parsed.tokenIndex}`;
    return `${parsed.surah}:${parsed.ayah}${tokenPart}`;
  }

  get evidenceCount(): number {
    return this.evidenceRecords.length;
  }

  get lexiconFields(): InspectorField[] {
    const meaning = this.meaningPrimary;
    const fields: InspectorField[] = [
      {
        id: 'lex-word',
        label: 'Word',
        value: this.activeWord,
        arabic: true,
      },
      {
        id: 'lex-id',
        label: 'ar_u_lexicon',
        value: this.resolvedLexiconId || '—',
      },
      {
        id: 'lex-root',
        label: 'Root',
        value: this.rootValue || '—',
        arabic: this.looksArabic(this.rootValue),
      },
      {
        id: 'lex-lemma',
        label: 'Lemma',
        value: this.lemmaValue || '—',
        arabic: this.looksArabic(this.lemmaValue),
      },
      {
        id: 'lex-pattern',
        label: 'Pattern',
        value: this.patternValue || '—',
      },
      {
        id: 'lex-pos',
        label: 'POS',
        value: this.posValue || '—',
      },
      {
        id: 'lex-meaning',
        label: 'Meaning',
        value: meaning || '—',
      },
    ];
    return fields;
  }

  get morphologyFields(): InspectorField[] {
    const linkRecord = this.activeLinkRecord;
    const fields: InspectorField[] = [];
    fields.push({
      id: 'm-location',
      label: 'Location',
      value: this.activeLocation,
    });
    fields.push({
      id: 'm-pos',
      label: 'Part of Speech',
      value: this.posValue || '—',
    });
    fields.push({
      id: 'm-pattern',
      label: 'Pattern',
      value: this.patternValue || '—',
    });
    fields.push({
      id: 'm-morph-id',
      label: 'ar_u_morphology',
      value: this.firstText(linkRecord, ['ar_u_morphology']) || '—',
    });
    fields.push({
      id: 'm-verb-form',
      label: 'Verb Form',
      value: this.firstText(linkRecord, ['verb_form']) || '—',
    });
    fields.push({
      id: 'm-derivation',
      label: 'Derivation',
      value: this.firstText(linkRecord, ['derivation_type']) || '—',
    });
    fields.push({
      id: 'm-transitivity',
      label: 'Transitivity',
      value: this.firstText(linkRecord, ['transitivity']) || '—',
    });
    fields.push({
      id: 'm-obj-count',
      label: 'Object Count',
      value: this.textValue(linkRecord?.['obj_count']) || '—',
    });
    fields.push({
      id: 'm-number',
      label: 'Noun Number',
      value: this.firstText(linkRecord, ['noun_number']) || '—',
    });
    return fields;
  }

  get morphologyFeatures(): MorphologyFeature[] {
    const record = this.activeMorphologyRecord;
    if (!record) return [];

    const features: MorphologyFeature[] = [];
    const morphology = record['morphology'];
    if (morphology && typeof morphology === 'object' && !Array.isArray(morphology)) {
      const featureSource = (morphology as Record<string, unknown>)['morph_features'];
      if (featureSource && typeof featureSource === 'object' && !Array.isArray(featureSource)) {
        for (const [key, value] of Object.entries(featureSource as Record<string, unknown>)) {
          const text = this.valueToDisplayText(value);
          if (!text) continue;
          features.push({
            id: `morph-feature-${key}`,
            key,
            value: text,
          });
        }
      }
    }

    const tagPairs: Array<[string, unknown]> = [
      ['tags_ar', record['tags_ar']],
      ['tags_en', record['tags_en']],
    ];
    for (const [key, value] of tagPairs) {
      const text = this.tokenizeListValue(value).join(', ');
      if (!text) continue;
      features.push({
        id: `morph-feature-${key}`,
        key,
        value: text,
      });
    }

    return features;
  }

  get relatedTerms(): string[] {
    const terms = new Set<string>();

    const alternatives = this.meaningAlternatives;
    for (const alt of alternatives) {
      if (alt) terms.add(alt);
    }

    const link = this.activeLinkRecord;
    for (const key of ['tags_en', 'tags_ar'] as const) {
      for (const token of this.tokenizeListValue(link?.[key])) {
        if (token) terms.add(token);
      }
    }

    return Array.from(terms).slice(0, 12);
  }

  get evidenceRecords(): Array<Record<string, unknown>> {
    const merged: Array<Record<string, unknown>> = [...this.selectedEvidenceRecords, ...this.remoteEvidenceRecords];
    const deduped: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();

    for (const item of merged) {
      const key = [
        this.textValue(item['ar_u_lexicon']) || this.resolvedLexiconId,
        this.textValue(item['source_id']) || this.textValue(item['source_type']),
        this.textValue(item['chunk_id']),
        this.textValue(item['extract_text']),
        this.textValue(item['note_md']),
      ].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    return deduped;
  }

  get hasMorphologyData(): boolean {
    return Boolean(this.activeMorphologyRecord || this.activeLinkRecord || this.morphologyFeatures.length);
  }

  get hasLexiconData(): boolean {
    const fields = this.lexiconFields;
    return fields.some((field) => field.value !== '—') || this.relatedTerms.length > 0;
  }

  setActiveTab(tab: QuranWordInspectorTab) {
    this.activeTab = tab;
  }

  requestClose() {
    this.close.emit();
  }

  evidenceHeading(item: Record<string, unknown>): string {
    const extract = this.textValue(item['extract_text']);
    if (extract) return extract;
    const heading = this.textValue(item['heading_raw']);
    if (heading) return heading;
    const location = this.textValue(item['word_location']);
    if (location) return `Word ${location}`;
    return 'Evidence';
  }

  evidenceSource(item: Record<string, unknown>): string {
    const sourceType = this.textValue(item['source_type']);
    const sourceId = this.textValue(item['source_id']);
    const chunkId = this.textValue(item['chunk_id']);
    const page = this.numberValue(item['page_no']);
    const heading = this.textValue(item['heading_raw']);
    const parts: string[] = [];

    if (heading) parts.push(heading);
    if (sourceType) parts.push(sourceType);
    if (sourceId) parts.push(sourceId);
    if (chunkId) parts.push(`chunk:${chunkId}`);
    if (page != null) parts.push(`p.${page}`);

    if (!parts.length) {
      const location = this.textValue(item['word_location']);
      if (location) return `Word ${location}`;
      return 'Source not set';
    }
    return parts.join(' | ');
  }

  evidenceRole(item: Record<string, unknown>): string {
    const role = this.textValue(item['link_role']).toLowerCase();
    if (!role) return 'supports';
    if (role === 'contradicts') return 'conflicts';
    return role;
  }

  evidenceNote(item: Record<string, unknown>): string {
    const note = this.textValue(item['note_md']);
    if (note) return note;
    const extract = this.textValue(item['extract_text']);
    if (extract) return extract;
    return '';
  }

  trackByField(_: number, field: InspectorField): string {
    return field.id;
  }

  trackByFeature(_: number, feature: MorphologyFeature): string {
    return feature.id;
  }

  trackByEvidence(index: number, item: Record<string, unknown>): string {
    const evidenceId = this.textValue(item['evidence_id']);
    if (evidenceId) return evidenceId;
    return `${this.textValue(item['source_id'])}|${this.textValue(item['chunk_id'])}|${index}`;
  }

  trackByTerm(index: number, term: string): string {
    return `${term}-${index}`;
  }

  private recomputeSelectionDetails() {
    if (!this.hasSelection || !this.selection) {
      this.selectedMorphologyRecord = null;
      this.selectedLinkRecord = null;
      this.selectedEvidenceRecords = [];
      this.resolvedLexiconId = '';
      this.clearRemoteState();
      return;
    }

    const location = this.normalizeLocation(this.selection.location);
    const normalizedWord = this.normalizeArabic(this.selection.text);
    const locationParts = this.parseLocation(this.selection.location, this.selection);

    this.selectedMorphologyRecord = this.findBestRecord({
      source: this.morphologyItems,
      location,
      normalizedWord,
      locationParts,
      textKeys: ['surface_ar', 'surface_norm', 'lemma_ar', 'lemma_norm', 'word', 'text'],
      preferredLexiconId: '',
    });

    const lexiconId =
      this.lexiconIdOf(this.selectedMorphologyRecord) ||
      this.lexiconIdOf(
        this.findBestRecord({
          source: this.lexiconMorphologyItems,
          location,
          normalizedWord,
          locationParts,
          textKeys: ['surface_ar', 'surface_norm'],
          preferredLexiconId: '',
        })
      );

    this.selectedLinkRecord = this.findBestRecord({
      source: this.lexiconMorphologyItems,
      location,
      normalizedWord,
      locationParts,
      textKeys: ['surface_ar', 'surface_norm'],
      preferredLexiconId: lexiconId,
    });

    const effectiveLexiconId = lexiconId || this.lexiconIdOf(this.selectedLinkRecord);
    this.resolvedLexiconId = effectiveLexiconId;
    this.selectedEvidenceRecords = this.findEvidenceMatches({
      location,
      locationParts,
      normalizedWord,
      lexiconId: effectiveLexiconId,
    });
    void this.syncRemoteLexiconBundle(effectiveLexiconId);
  }

  private async syncRemoteLexiconBundle(lexiconId: string) {
    const normalizedLexiconId = this.textValue(lexiconId);
    this.remoteSequence += 1;
    const requestId = this.remoteSequence;

    if (!normalizedLexiconId) {
      this.clearRemoteState();
      return;
    }

    if (this.remoteLexiconId === normalizedLexiconId && this.remoteBundle) {
      this.remoteError = '';
      this.remoteLoading = false;
      return;
    }

    this.remoteLoading = true;
    this.remoteError = '';
    try {
      const bundle = await this.lexiconData.getLexiconBundle(normalizedLexiconId);
      if (requestId !== this.remoteSequence) return;
      this.remoteBundle = bundle;
      this.remoteLexiconId = normalizedLexiconId;
    } catch (error: unknown) {
      if (requestId !== this.remoteSequence) return;
      this.remoteBundle = null;
      this.remoteLexiconId = normalizedLexiconId;
      this.remoteError = error instanceof Error ? error.message : 'Failed to load lexicon data.';
    } finally {
      if (requestId === this.remoteSequence) {
        this.remoteLoading = false;
      }
    }
  }

  private clearRemoteState() {
    this.remoteBundle = null;
    this.remoteLexiconId = '';
    this.remoteLoading = false;
    this.remoteError = '';
  }

  private get rootValue(): string {
    const fromMorphology = this.firstText(this.activeMorphologyRecord, ['root_norm', 'root']);
    if (fromMorphology) return fromMorphology;
    return this.firstText(this.activeLinkRecord, ['root_norm', 'root']);
  }

  private get lemmaValue(): string {
    const fromMorphology = this.firstText(this.activeMorphologyRecord, ['lemma_ar', 'lemma_norm']);
    if (fromMorphology) return fromMorphology;
    return this.firstText(this.activeLinkRecord, ['surface_ar', 'surface_norm']);
  }

  private get posValue(): string {
    const fromMorphology = this.firstText(this.activeMorphologyRecord, ['pos', 'pos2']);
    if (fromMorphology) return fromMorphology;
    return this.firstText(this.activeLinkRecord, ['pos2', 'pos']);
  }

  private get patternValue(): string {
    const fromMorphology = this.patternFromRecord(this.activeMorphologyRecord);
    if (fromMorphology) return fromMorphology;
    return this.patternFromRecord(this.activeLinkRecord);
  }

  private get meaningPrimary(): string {
    const morphologyPrimary = this.translationPrimary(this.activeMorphologyRecord);
    if (morphologyPrimary) return morphologyPrimary;
    return this.firstText(this.activeLinkRecord, ['notes']);
  }

  private get meaningAlternatives(): string[] {
    const record = this.activeMorphologyRecord;
    if (!record) return [];
    const translation = record['translation'];
    if (!translation || typeof translation !== 'object' || Array.isArray(translation)) return [];
    const alternatives = (translation as Record<string, unknown>)['alternatives'];
    if (!Array.isArray(alternatives)) return [];
    return alternatives.map((entry) => this.textValue(entry)).filter(Boolean);
  }

  private get activeMorphologyRecord(): Record<string, unknown> | null {
    const local = this.selectedMorphologyRecord;
    const remote = this.remoteFocusedMorphologyRecord;
    if (local && remote) {
      return { ...remote, ...local };
    }
    return local ?? remote;
  }

  private get activeLinkRecord(): Record<string, unknown> | null {
    const local = this.selectedLinkRecord;
    const remote = this.remoteFocusedLinkRecord;
    if (local && remote) {
      return { ...remote, ...local };
    }
    return local ?? remote;
  }

  private get remoteFocusedMorphologyRecord(): Record<string, unknown> | null {
    const bundle = this.remoteBundle;
    if (!bundle) return null;
    const morphologyId = this.resolveFocusedMorphologyId(bundle);
    if (!morphologyId) return null;
    const row = bundle.morphologyById[morphologyId];
    if (!row) return null;
    return { ...row };
  }

  private get remoteFocusedLinkRecord(): Record<string, unknown> | null {
    const bundle = this.remoteBundle;
    if (!bundle) return null;
    const morphologyId = this.resolveFocusedMorphologyId(bundle);
    if (!morphologyId) return null;
    const link = bundle.morphologyLinks.find((entry) => this.textValue(entry.ar_u_morphology) === morphologyId) ?? null;
    if (!link) return null;
    return this.toLinkRecord(link);
  }

  private get remoteEvidenceRecords(): Array<Record<string, unknown>> {
    const bundle = this.remoteBundle;
    if (!bundle) return [];
    return bundle.evidenceRows.map((row) => this.toEvidenceRecord(row, bundle.lexiconId));
  }

  private resolveFocusedMorphologyId(bundle: QuranLexiconBundle): string {
    const directIds = [
      this.firstText(this.selectedLinkRecord, ['ar_u_morphology']),
      this.firstText(this.selectedMorphologyRecord, ['ar_u_morphology']),
    ].filter(Boolean);
    for (const id of directIds) {
      if (bundle.morphologyById[id]) return id;
    }

    const normalizedWord = this.normalizeArabic(this.activeWord);
    if (normalizedWord) {
      const match = bundle.morphologyLinks.find((row) => {
        const surfaceAr = this.normalizeArabic(this.textValue(row.surface_ar));
        const surfaceNorm = this.normalizeArabic(this.textValue(row.surface_norm));
        return surfaceAr === normalizedWord || surfaceNorm === normalizedWord;
      });
      if (match && bundle.morphologyById[this.textValue(match.ar_u_morphology)]) {
        return this.textValue(match.ar_u_morphology);
      }
    }

    const first = bundle.morphologyLinks.find((entry) => bundle.morphologyById[this.textValue(entry.ar_u_morphology)]);
    return first ? this.textValue(first.ar_u_morphology) : '';
  }

  private toEvidenceRecord(row: QuranLexiconEvidenceRow, lexiconId: string): Record<string, unknown> {
    return {
      ar_u_lexicon: lexiconId,
      source_type: row.source_code || 'source',
      source_id: row.source_code || '',
      heading_raw: row.title || '',
      page_no: row.page_no,
      chunk_id: row.chunk_id,
      extract_text: row.extract_text || '',
      note_md: row.notes || '',
      link_role: 'supports',
    };
  }

  private toLinkRecord(link: QuranLexiconMorphologyLink): Record<string, unknown> {
    return {
      ar_u_lexicon: link.ar_u_lexicon,
      ar_u_morphology: link.ar_u_morphology,
      link_role: link.link_role,
      surface_ar: link.surface_ar,
      surface_norm: link.surface_norm,
      pos2: link.pos2,
      derived_pattern: link.derived_pattern,
      verb_form: link.verb_form,
      created_at: link.created_at,
    };
  }

  private formatRefFromSelection(selection: QuranWordInspectorSelection): string {
    const surah = this.numberValue(selection.surah);
    const ayah = this.numberValue(selection.ayah);
    const tokenIndex = this.numberValue(selection.tokenIndex);
    if (surah == null || ayah == null) return '';
    if (tokenIndex == null) return `${surah}:${ayah}`;
    return `${surah}:${ayah}:${tokenIndex}`;
  }

  private findBestRecord(config: {
    source: Array<Record<string, unknown>>;
    location: string;
    normalizedWord: string;
    locationParts: WordLocationParts;
    textKeys: string[];
    preferredLexiconId: string;
  }): Record<string, unknown> | null {
    let best: Record<string, unknown> | null = null;
    let bestScore = 0;

    for (const item of config.source) {
      const score = this.scoreRecord({
        item,
        location: config.location,
        normalizedWord: config.normalizedWord,
        locationParts: config.locationParts,
        textKeys: config.textKeys,
        preferredLexiconId: config.preferredLexiconId,
      });
      if (score <= bestScore) continue;
      bestScore = score;
      best = item;
    }

    return bestScore > 0 ? best : null;
  }

  private scoreRecord(config: {
    item: Record<string, unknown>;
    location: string;
    normalizedWord: string;
    locationParts: WordLocationParts;
    textKeys: string[];
    preferredLexiconId: string;
  }): number {
    const item = config.item;
    let score = 0;

    const itemLocation = this.locationFromRecord(item);
    if (config.location && itemLocation && itemLocation === config.location) {
      score += 14;
    } else if (this.matchesLocationParts(item, config.locationParts)) {
      score += 9;
    }

    if (config.normalizedWord) {
      for (const key of config.textKeys) {
        const value = this.normalizeArabic(this.textValue(item[key]));
        if (!value) continue;
        if (value === config.normalizedWord) {
          score += 6;
          break;
        }
      }
    }

    if (config.preferredLexiconId) {
      const itemLexiconId = this.lexiconIdOf(item);
      if (itemLexiconId && itemLexiconId === config.preferredLexiconId) {
        score += 5;
      }
    }

    if (this.patternFromRecord(item)) score += 1;
    if (this.firstText(item, ['pos', 'pos2'])) score += 1;
    return score;
  }

  private findEvidenceMatches(config: {
    location: string;
    locationParts: WordLocationParts;
    normalizedWord: string;
    lexiconId: string;
  }): Array<Record<string, unknown>> {
    const ranked = this.evidenceItems
      .map((item) => ({
        item,
        score: this.scoreEvidenceRecord(item, config),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    return ranked.map((entry) => entry.item);
  }

  private scoreEvidenceRecord(
    item: Record<string, unknown>,
    config: { location: string; locationParts: WordLocationParts; normalizedWord: string; lexiconId: string }
  ): number {
    let score = 0;
    const itemLocation = this.locationFromRecord(item);
    if (config.location && itemLocation && itemLocation === config.location) {
      score += 14;
    } else if (this.matchesLocationParts(item, config.locationParts)) {
      score += 9;
    }

    if (config.lexiconId) {
      const evidenceLexiconId = this.lexiconIdOf(item);
      if (evidenceLexiconId && evidenceLexiconId === config.lexiconId) {
        score += 8;
      }
    }

    if (config.normalizedWord) {
      const extract = this.normalizeArabic(this.textValue(item['extract_text']));
      const heading = this.normalizeArabic(this.textValue(item['heading_raw']));
      if (extract && extract === config.normalizedWord) score += 5;
      if (heading && heading.includes(config.normalizedWord)) score += 2;
    }

    return score;
  }

  private locationFromRecord(item: Record<string, unknown>): string {
    const direct = this.normalizeLocation(this.textValue(item['word_location']));
    if (direct) return direct;

    const surah = this.numberValue(item['surah']);
    const ayah = this.numberValue(item['ayah']);
    const token = this.numberValue(item['token_index']);
    if (surah == null || ayah == null) return '';
    if (token == null) return `${surah}:${ayah}`;
    return `${surah}:${ayah}:${token}`;
  }

  private matchesLocationParts(item: Record<string, unknown>, parts: WordLocationParts): boolean {
    if (parts.surah == null || parts.ayah == null) return false;
    const surah = this.numberValue(item['surah']);
    const ayah = this.numberValue(item['ayah']);
    if (surah == null || ayah == null || surah !== parts.surah || ayah !== parts.ayah) {
      return false;
    }
    if (parts.tokenIndex == null) return true;
    const token = this.numberValue(item['token_index']);
    return token != null && token === parts.tokenIndex;
  }

  private parseLocation(location: string, fallback: QuranWordInspectorSelection): WordLocationParts {
    const normalized = this.normalizeLocation(location);
    const segments = normalized.split(':').filter(Boolean);
    if (segments.length >= 2) {
      const surah = this.numberValue(segments[0]);
      const ayah = this.numberValue(segments[1]);
      const tokenIndex = this.numberValue(segments[2]);
      if (surah != null && ayah != null) {
        return { surah, ayah, tokenIndex };
      }
    }

    return {
      surah: this.numberValue(fallback.surah),
      ayah: this.numberValue(fallback.ayah),
      tokenIndex: this.numberValue(fallback.tokenIndex),
    };
  }

  private patternFromRecord(record: Record<string, unknown> | null): string {
    const direct = this.firstText(record, ['morph_pattern', 'derived_pattern', 'verb_form', 'pattern']);
    if (direct) return direct;

    const morphology = record?.['morphology'];
    if (!morphology || typeof morphology !== 'object' || Array.isArray(morphology)) return '';
    const singular = (morphology as Record<string, unknown>)['singular'];
    if (!singular || typeof singular !== 'object' || Array.isArray(singular)) return '';
    return this.textValue((singular as Record<string, unknown>)['pattern']);
  }

  private translationPrimary(record: Record<string, unknown> | null): string {
    if (!record) return '';
    const translation = record['translation'];
    if (typeof translation === 'string') return translation.trim();
    if (!translation || typeof translation !== 'object' || Array.isArray(translation)) return '';
    const primary = (translation as Record<string, unknown>)['primary'];
    return this.textValue(primary);
  }

  private lexiconIdOf(record: Record<string, unknown> | null): string {
    if (!record) return '';
    return this.firstText(record, ['ar_u_lexicon', 'lexicon_id']);
  }

  private firstText(record: Record<string, unknown> | null | undefined, keys: string[]): string {
    if (!record) return '';
    for (const key of keys) {
      const value = this.textValue(record[key]);
      if (value) return value;
    }
    return '';
  }

  private tokenizeListValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((entry) => this.textValue(entry)).filter(Boolean);
    }
    const text = this.textValue(value);
    if (!text) return [];
    return text
      .split(/[|;,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private normalizeArabic(value: string): string {
    return String(value)
      .normalize('NFKC')
      .replace(this.arabicDiacriticsRe, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/[ـ]/g, '')
      .trim();
  }

  private normalizeLocation(value: string): string {
    return String(value).trim();
  }

  private textValue(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  private numberValue(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  private valueToDisplayText(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value.map((entry) => this.valueToDisplayText(entry)).filter(Boolean).join(', ');
    }
    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }
    return '';
  }

  private looksArabic(value: string): boolean {
    return /[\u0600-\u06FF]/.test(value);
  }
}
