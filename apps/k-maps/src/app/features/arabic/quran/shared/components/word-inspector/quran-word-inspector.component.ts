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
export type QuranWordInspectorAppearance = 'card' | 'panel';

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

type InsightPair = {
  id: string;
  label: string;
  value: string;
  arabic?: boolean;
};

type KeyInfoBadge = {
  id: string;
  label: string;
  value: string;
  arabic?: boolean;
};

type EvidenceMetaPill = {
  id: string;
  label: string;
  value: string;
};

type EvidenceExample = {
  title: string;
  text: string;
  source: string;
};

const trackTextValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
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
  @Input() surahLabel = '';
  @Input() appearance: QuranWordInspectorAppearance = 'card';
  @Input() morphologyItems: Array<Record<string, unknown>> = [];
  @Input() lexiconMorphologyItems: Array<Record<string, unknown>> = [];
  @Input() evidenceItems: Array<Record<string, unknown>> = [];
  @Output() close = new EventEmitter<void>();

  activeTab: QuranWordInspectorTab = 'lexicon';
  remoteLoading = false;
  remoteError = '';
  resolvedLexiconId = '';

  private readonly arabicDiacriticsRe = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
  private readonly arabicScriptRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
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

  get activeSurahReferenceLabel(): string {
    const surah = this.textValue(this.surahLabel);
    const reference = this.activeReferenceLabel;
    if (surah && reference && reference !== '—') return `Surah ${surah} | ${reference}`;
    if (surah) return `Surah ${surah}`;
    return reference;
  }

  get evidenceCount(): number {
    return this.evidenceDisplayRecords.length;
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

  get transliterationValue(): string {
    return (
      this.firstText(this.activeMorphologyRecord, [
        'transliteration',
        'translit',
        'latin',
        'latin_text',
        'pronunciation',
        'phonetic',
      ]) ||
      this.firstText(this.activeLinkRecord, ['transliteration', 'translit', 'latin', 'latin_text', 'pronunciation', 'phonetic'])
    );
  }

  get posBadge(): string {
    const pos = this.posValue;
    return pos ? pos.toUpperCase() : '';
  }

  get primaryMeaning(): string {
    return this.meaningPrimary || '—';
  }

  get secondaryMeaning(): string {
    return this.meaningHighlights[1] || '';
  }

  get meaningHighlights(): string[] {
    const values: string[] = [];
    const primary = this.meaningPrimary;
    if (primary) values.push(primary);

    for (const item of this.meaningAlternatives) {
      const value = item.trim();
      if (!value || values.includes(value)) continue;
      values.push(value);
      if (values.length >= 2) break;
    }

    return values;
  }

  get keyInfoBadges(): KeyInfoBadge[] {
    const form = this.firstText(this.activeLinkRecord, ['verb_form', 'form']);
    const badges: KeyInfoBadge[] = [];

    if (this.rootValue) {
      badges.push({
        id: 'badge-root',
        label: 'Root',
        value: this.rootValue,
        arabic: this.looksArabic(this.rootValue),
      });
    }

    if (this.lemmaValue) {
      badges.push({
        id: 'badge-lemma',
        label: 'Lemma',
        value: this.lemmaValue,
        arabic: this.looksArabic(this.lemmaValue),
      });
    }

    if (this.patternValue) {
      badges.push({
        id: 'badge-pattern',
        label: 'Pattern',
        value: this.patternValue,
      });
    }

    if (form) {
      badges.push({
        id: 'badge-form',
        label: 'Form',
        value: form,
      });
    }

    if (this.posValue) {
      badges.push({
        id: 'badge-pos',
        label: 'POS',
        value: this.posValue.toUpperCase(),
      });
    }

    return badges;
  }

  get featuredEvidenceExample(): EvidenceExample | null {
    const candidate =
      this.evidenceRecords.find((entry) => this.evidenceGroupTitle(entry) === 'Qur\'an Example' && Boolean(this.evidenceNote(entry))) ??
      this.evidenceRecords.find((entry) => Boolean(this.evidenceNote(entry)));
    if (!candidate) return null;
    return {
      title: this.evidenceGroupTitle(candidate),
      text: this.evidenceNote(candidate),
      source: this.evidenceSource(candidate),
    };
  }

  get lexicalInsightPairs(): InsightPair[] {
    const form = this.firstText(this.activeLinkRecord, ['verb_form', 'form']);
    return [
      {
        id: 'pair-root',
        label: 'Root',
        value: this.rootValue || '—',
        arabic: this.looksArabic(this.rootValue),
      },
      {
        id: 'pair-lemma',
        label: 'Lemma',
        value: this.lemmaValue || '—',
        arabic: this.looksArabic(this.lemmaValue),
      },
      {
        id: 'pair-pattern',
        label: 'Pattern',
        value: this.patternValue || '—',
      },
      {
        id: 'pair-form',
        label: 'Form',
        value: form || '—',
      },
    ];
  }

  get semanticChips(): string[] {
    const out = new Set<string>();
    const meaning = this.meaningPrimary;
    if (meaning) out.add(meaning);
    for (const item of this.meaningAlternatives) {
      if (item) out.add(item);
    }
    for (const item of this.relatedTerms) {
      if (item) out.add(item);
    }
    return Array.from(out).slice(0, 10);
  }

  get morphologyCardWord(): string {
    return this.morphologySingularForm || this.lemmaValue || this.activeWord || '—';
  }

  get morphologyCardRoot(): string {
    return this.rootValue || '—';
  }

  get morphologyCardPattern(): string {
    return this.morphologySingularPattern || this.patternValue || '—';
  }

  get morphologyCardDerivationType(): string {
    return this.firstText(this.morphologyFeatureRecord, ['derivation_type']);
  }

  get morphologySingularForm(): string {
    return this.firstText(this.morphologySingularRecord, ['form_ar']);
  }

  get morphologySingularPattern(): string {
    return this.firstText(this.morphologySingularRecord, ['pattern']);
  }

  get morphologyPluralForm(): string {
    return this.firstText(this.morphologyPluralRecord, ['form_ar']);
  }

  get morphologyPluralPattern(): string {
    return this.firstText(this.morphologyPluralRecord, ['pattern']);
  }

  get morphologyPluralType(): string {
    return this.firstText(this.morphologyPluralRecord, ['type']);
  }

  get morphologyDerivedTriplet(): string {
    const source = this.morphologyDerivedFromVerbRecord;
    if (!source) return '';
    const parts = [
      this.firstText(source, ['past']),
      this.firstText(source, ['present']),
      this.firstText(source, ['masdar']),
    ].filter(Boolean);
    return parts.join(' - ');
  }

  get morphologyFeatureBadges(): string[] {
    const features = this.morphologyFeatureRecord;
    if (!features) return [];

    const labels: string[] = [];
    const isMushtaq = features['is_mushtaq'] === true;
    if (isMushtaq) labels.push('مشتق');

    const isTriliteral = features['is_triliteral_root'] === true;
    const rootClass = this.firstText(features, ['root_class']);
    if (isTriliteral && rootClass) {
      labels.push(`ثلاثي ${rootClass}`);
    } else if (isTriliteral) {
      labels.push('ثلاثي');
    } else if (rootClass) {
      labels.push(rootClass);
    }

    return labels;
  }

  get morphologyHeaderPills(): string[] {
    const out = new Set<string>();
    if (this.morphologyCardDerivationType) out.add(this.morphologyCardDerivationType);
    for (const feature of this.morphologyFeatureBadges) {
      if (feature) out.add(feature);
    }
    return Array.from(out).slice(0, 4);
  }

  get morphologyCardMeanings(): string[] {
    const record = this.activeMorphologyRecord;
    if (!record) return [];
    const meanings = record['meanings'];
    if (!Array.isArray(meanings)) return [];
    return meanings.map((item) => this.textValue(item)).filter(Boolean);
  }

  get hasMorphologyCardData(): boolean {
    return Boolean(
      this.morphologyCardWord !== '—' ||
        this.morphologyCardRoot !== '—' ||
        this.morphologySingularForm ||
        this.morphologyPluralForm ||
        this.morphologyDerivedTriplet ||
        this.morphologyCardMeanings.length
    );
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

  get evidenceDisplayRecords(): Array<Record<string, unknown>> {
    return this.evidenceRecords.filter((item) => Boolean(this.evidenceExtractText(item)));
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
    const extract = this.cleanEvidenceText(item['extract_text']);
    if (extract) return extract;
    const heading = this.cleanEvidenceText(item['heading_raw']);
    if (heading) return heading;
    const location = this.cleanEvidenceText(item['word_location']);
    if (location) return `Word ${location}`;
    return 'Evidence';
  }

  evidenceSource(item: Record<string, unknown>): string {
    const location = this.locationFromRecord(item);
    const segments = location.split(':').filter(Boolean);
    const sourceType = this.cleanEvidenceText(item['source_type']);
    const sourceId = this.cleanEvidenceText(item['source_id']);
    const chunkId = this.cleanEvidenceText(item['chunk_id']);
    const page = this.numberValue(item['page_no']);
    const parts: string[] = [];

    if (segments.length >= 2) {
      const surah = this.numberValue(segments[0]);
      const ayah = this.numberValue(segments[1]);
      if (surah != null && ayah != null) {
        parts.push(`Surah ${surah}:${ayah}`);
      }
    }

    if (sourceType) parts.push(sourceType);
    if (sourceId && sourceId !== sourceType) parts.push(sourceId);
    if (chunkId) parts.push(`chunk:${chunkId}`);
    if (page != null) parts.push(`p.${page}`);

    if (!parts.length) {
      if (location) return `Word ${location}`;
      return 'Source not set';
    }
    return parts.join(' | ');
  }

  evidenceMetaPills(item: Record<string, unknown>): EvidenceMetaPill[] {
    const pills: EvidenceMetaPill[] = [];
    const linkRole = this.textValue(item['link_role']) || this.evidenceRole(item);
    const evidenceKind = this.textValue(item['evidence_kind']);
    const evidenceStrength = this.textValue(item['evidence_strength']);

    if (linkRole) {
      pills.push({
        id: 'link_role',
        label: 'link_role',
        value: linkRole,
      });
    }

    if (evidenceKind) {
      pills.push({
        id: 'evidence_kind',
        label: 'evidence_kind',
        value: evidenceKind,
      });
    }

    if (evidenceStrength) {
      pills.push({
        id: 'evidence_strength',
        label: 'evidence_strength',
        value: evidenceStrength,
      });
    }

    return pills;
  }

  evidenceRole(item: Record<string, unknown>): string {
    const role = this.textValue(item['link_role']).toLowerCase();
    if (!role) return 'supports';
    if (role === 'contradicts') return 'conflicts';
    return role;
  }

  evidenceNote(item: Record<string, unknown>): string {
    const note = this.cleanEvidenceText(item['note_md']);
    if (note) return note;
    const extract = this.cleanEvidenceText(item['extract_text']);
    if (extract) return extract;
    return '';
  }

  evidenceExtractText(item: Record<string, unknown>): string {
    return this.cleanEvidenceText(item['extract_text']);
  }

  isArabicText(value: string): boolean {
    return this.looksArabic(value);
  }

  evidenceGroupTitle(item: Record<string, unknown>): string {
    const sourceType = this.textValue(item['source_type']);
    const sourceId = this.textValue(item['source_id']);
    const source = `${sourceType} ${sourceId}`.toLowerCase();
    if (source.includes('quran')) return 'Qur\'an Example';
    if (source.includes('lex') || source.includes('dictionary') || source.includes('book')) return 'Definition';
    if (source.includes('sinai') || source.includes('scholar') || source.includes('tafsir')) return 'Scholarly Note';
    return 'Evidence';
  }

  trackByField = (_: number, field: InspectorField): string => field.id;

  trackByPair = (_: number, pair: InsightPair): string => pair.id;

  trackByBadge = (_: number, badge: KeyInfoBadge): string => badge.id;

  trackByEvidence = (index: number, item: Record<string, unknown>): string => {
    const evidenceId = trackTextValue(item['evidence_id']);
    if (evidenceId) return evidenceId;
    return `${trackTextValue(item['source_id'])}|${trackTextValue(item['chunk_id'])}|${index}`;
  };

  trackByEvidencePill = (_: number, pill: EvidenceMetaPill): string => pill.id;

  trackByTerm = (index: number, term: string): string => `${term}-${index}`;

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

  private get morphologyParadigm(): string {
    const directCandidates = [
      this.firstText(this.activeMorphologyRecord, [
        'morph_triplet',
        'morphology_triplet',
        'verb_triplet',
        'paradigm_ar',
        'paradigm',
        'canonical_input',
      ]),
      this.firstText(this.activeLinkRecord, ['paradigm_ar', 'paradigm']),
    ];

    for (const candidate of directCandidates) {
      const normalized = this.normalizeParadigmCandidate(candidate);
      if (normalized) return normalized;
    }

    const fromObject = this.paradigmFromMorphologyObject(this.activeMorphologyRecord?.['morphology']);
    if (fromObject) return fromObject;

    const fallback = this.firstText(this.activeMorphologyRecord, ['surface_ar', 'lemma_ar']);
    return this.normalizeParadigmCandidate(fallback);
  }

  private get nounLemma(): string {
    const pos = this.posValue.toLowerCase();
    if (pos && pos !== 'noun') return '';

    return (
      this.firstText(this.activeMorphologyRecord, ['lemma_ar', 'surface_ar']) ||
      this.firstText(this.activeLinkRecord, ['lemma_ar', 'surface_ar']) ||
      this.lemmaValue
    );
  }

  private get derivedVerbTriplet(): string {
    const record = this.derivedFromVerbRecord;
    if (!record) return '';

    const past = this.firstText(record, ['past', 'verb_past', 'perfect']);
    const present = this.firstText(record, ['present', 'verb_present', 'imperfect']);
    const masdar = this.firstText(record, ['masdar', 'verbal_noun', 'infinitive']);

    const parts = [past, present, masdar].filter(Boolean);
    if (!parts.length) return '';
    return parts.join('-');
  }

  private get derivedFromVerbRecord(): Record<string, unknown> | null {
    const candidates = [
      this.extractDerivedFromVerb(this.activeMorphologyRecord),
      this.extractDerivedFromVerb(this.activeLinkRecord),
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      return candidate;
    }
    return null;
  }

  private get meaningRangeTerms(): string[] {
    const values: string[] = [];

    const pushTokens = (value: unknown) => {
      for (const token of this.parseMeaningTokens(value)) {
        const normalized = token.replace(/\s+/g, ' ').trim();
        if (normalized) values.push(normalized);
      }
    };

    pushTokens(this.firstText(this.activeMorphologyRecord, ['gloss_en']));
    pushTokens(this.firstText(this.activeLinkRecord, ['gloss_en']));
    pushTokens(this.firstText(this.activeMorphologyRecord, ['notes']));
    pushTokens(this.firstText(this.activeLinkRecord, ['notes']));
    pushTokens(this.activeMorphologyRecord?.['synonyms_json']);
    pushTokens(this.activeLinkRecord?.['synonyms_json']);
    pushTokens(this.activeMorphologyRecord?.['tags_en']);
    pushTokens(this.activeLinkRecord?.['tags_en']);
    pushTokens(this.meaningPrimary);
    for (const item of this.meaningAlternatives) {
      pushTokens(item);
    }

    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(value.replace(/\.$/, '').trim());
    }

    const englishFirst = deduped.filter((entry) => !this.looksArabic(entry));
    const selected = englishFirst.length ? englishFirst : deduped;
    return selected.slice(0, 8);
  }

  private get morphologyRecord(): Record<string, unknown> | null {
    return this.asRecord(this.activeMorphologyRecord?.['morphology']);
  }

  private get morphologySingularRecord(): Record<string, unknown> | null {
    return this.asRecord(this.morphologyRecord?.['singular']);
  }

  private get morphologyPluralRecord(): Record<string, unknown> | null {
    return this.asRecord(this.morphologyRecord?.['plural']);
  }

  private get morphologyFeatureRecord(): Record<string, unknown> | null {
    return this.asRecord(this.morphologyRecord?.['morph_features']);
  }

  private get morphologyDerivedFromVerbRecord(): Record<string, unknown> | null {
    return this.asRecord(this.morphologyFeatureRecord?.['derived_from_verb']);
  }

  private extractDerivedFromVerb(source: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!source) return null;

    const direct = this.asRecord(source['derived_from_verb']);
    if (direct && this.hasVerbTripletParts(direct)) return direct;

    const morphMeta = this.asRecord(source['morph_meta']);
    if (morphMeta) {
      const nested = this.asRecord(morphMeta['derived_from_verb']);
      if (nested && this.hasVerbTripletParts(nested)) return nested;
      if (this.hasVerbTripletParts(morphMeta)) return morphMeta;
    }

    const meta = this.asRecord(source['meta']);
    if (meta) {
      const nested = this.asRecord(meta['derived_from_verb']);
      if (nested && this.hasVerbTripletParts(nested)) return nested;
      const nestedMorphMeta = this.asRecord(meta['morph_meta']);
      if (nestedMorphMeta) {
        const nestedFromMorphMeta = this.asRecord(nestedMorphMeta['derived_from_verb']);
        if (nestedFromMorphMeta && this.hasVerbTripletParts(nestedFromMorphMeta)) return nestedFromMorphMeta;
        if (this.hasVerbTripletParts(nestedMorphMeta)) return nestedMorphMeta;
      }
    }

    const morphology = this.asRecord(source['morphology']);
    if (morphology) {
      const nested = this.asRecord(morphology['derived_from_verb']);
      if (nested && this.hasVerbTripletParts(nested)) return nested;
    }

    return null;
  }

  private hasVerbTripletParts(record: Record<string, unknown>): boolean {
    return Boolean(
      this.firstText(record, ['past', 'verb_past', 'perfect']) ||
        this.firstText(record, ['present', 'verb_present', 'imperfect']) ||
        this.firstText(record, ['masdar', 'verbal_noun', 'infinitive'])
    );
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

  private normalizeParadigmCandidate(value: string): string {
    const raw = this.textValue(value);
    if (!raw) return '';

    const afterPipe = raw.includes('|') ? raw.split('|').pop() ?? '' : raw;
    const normalized = afterPipe
      .replace(/\s*[-–—]\s*/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return '';
    if (normalized.includes('-')) return normalized;

    if (this.looksArabic(normalized)) {
      const words = normalized.split(/\s+/).filter(Boolean);
      if (words.length >= 3) return words.slice(0, 3).join('-');
    }

    return normalized;
  }

  private paradigmFromMorphologyObject(value: unknown): string {
    const morphology = this.asRecord(value);
    if (!morphology) return '';

    const collected = this.collectParadigmParts(morphology);
    if (collected.length >= 2) return collected.slice(0, 3).join('-');
    if (collected.length === 1) return collected[0];

    const singular = this.asRecord(morphology['singular']);
    if (!singular) return '';
    const fromSingular = this.collectParadigmParts(singular);
    if (fromSingular.length >= 2) return fromSingular.slice(0, 3).join('-');
    if (fromSingular.length === 1) return fromSingular[0];
    return '';
  }

  private collectParadigmParts(record: Record<string, unknown>): string[] {
    const keys = [
      'past',
      'present',
      'masdar',
      'perfect',
      'imperfect',
      'verbal_noun',
      'verb_past',
      'verb_present',
      'infinitive',
      'form',
      'pattern',
    ];

    const values: string[] = [];
    for (const key of keys) {
      const text = this.extractParadigmText(record[key]);
      if (!text || values.includes(text)) continue;
      values.push(text);
      if (values.length >= 3) break;
    }
    return values;
  }

  private extractParadigmText(value: unknown): string {
    if (typeof value === 'string') {
      const text = value.trim();
      return text;
    }

    if (!value || typeof value !== 'object') return '';

    if (Array.isArray(value)) {
      for (const entry of value) {
        const text = this.extractParadigmText(entry);
        if (text) return text;
      }
      return '';
    }

    const record = value as Record<string, unknown>;
    for (const key of ['ar', 'surface_ar', 'lemma_ar', 'text', 'word', 'value', 'form', 'past', 'present', 'masdar']) {
      const text = this.extractParadigmText(record[key]);
      if (text) return text;
    }
    return '';
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
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

  private parseMeaningTokens(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => this.textValue(entry))
        .map((entry) => entry.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    }

    const raw = this.textValue(value);
    if (!raw) return [];

    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((entry) => this.textValue(entry))
            .map((entry) => entry.replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        }
      } catch {
        // Ignore parse errors and fall back to token split.
      }
    }

    return trimmed
      .split(/[|;,]/)
      .map((entry) => entry.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
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

  private cleanEvidenceText(value: unknown): string {
    const raw = this.textValue(value);
    if (!raw) return '';
    return raw
      .replace(this.arabicScriptRe, ' ')
      .replace(/\*+/g, '')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s*\|\s*/g, ' | ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s|:,\-.]+/, '')
      .replace(/[\s|:,\-.]+$/, '')
      .trim();
  }

  private looksArabic(value: string): boolean {
    return /[\u0600-\u06FF]/.test(value);
  }
}
