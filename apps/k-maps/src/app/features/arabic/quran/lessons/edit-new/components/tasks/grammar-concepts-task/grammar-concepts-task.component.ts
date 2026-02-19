import { CommonModule } from '@angular/common';
import { Component, DoCheck, Input, inject } from '@angular/core';
import { AppTabsComponent, type AppTabItem } from '../../../../../../../../shared/components';
import { QuranLessonTaskJsonComponent } from '../task-json/task-json.component';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, TaskTab } from '../../../models/editor.types';

@Component({
  selector: 'app-grammar-concepts-task',
  standalone: true,
  imports: [CommonModule, AppTabsComponent, QuranLessonTaskJsonComponent],
  templateUrl: './grammar-concepts-task.component.html',
  styleUrls: ['./grammar-concepts-task.component.scss'],
})
export class GrammarConceptsTaskComponent implements DoCheck {
  private readonly facade = inject(QuranLessonEditorFacade);
  private autoSeeded = false;
  @Input() readOnly = false;
  readonly tabs: AppTabItem[] = [
    { id: 'items', label: 'Concept Items' },
    { id: 'json', label: 'Task JSON' },
  ];
  activeTabId: 'items' | 'json' = 'json';

  get state(): EditorState {
    return this.facade.state;
  }

  get tab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'grammar_concepts') ?? null;
  }

  get sentenceItems(): Array<Record<string, unknown>> {
    return this.facade.getSentenceItems();
  }

  get items(): GrammarConceptItem[] {
    const tab = this.tab;
    if (!tab) return [];
    try {
      const parsed = JSON.parse(tab.json || '{}');
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      return list.filter((item: unknown) => item && typeof item === 'object') as GrammarConceptItem[];
    } catch {
      return [];
    }
  }

  get displayItems(): GrammarConceptItem[] {
    if (this.items.length) return this.items;
    return this.mapDerivedToItems(this.derivedConcepts);
  }

  get derivedConcepts(): DerivedGrammarConcept[] {
    return this.extractGrammarConcepts(this.sentenceItems);
  }

  get conceptGroups(): ConceptGroup[] {
    return this.toConceptGroups(this.displayItems);
  }

  ngDoCheck() {
    if (this.readOnly) return;
    this.ensureSeededFromSentenceStructure();
  }

  onTabChange(tab: AppTabItem) {
    this.activeTabId = tab.id === 'json' ? 'json' : 'items';
  }

  loadFromSentenceStructure() {
    if (this.readOnly) return;
    const items = this.mapDerivedToItems(this.derivedConcepts);
    this.writeItems(items);
    this.activeTabId = 'json';
  }

  removeItem(index: number) {
    if (this.readOnly) return;
    const items = [...this.displayItems];
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.writeItems(items);
  }

  private getGrammarConceptsTab(): TaskTab | null {
    return this.state.taskTabs.find((entry) => entry.type === 'grammar_concepts') ?? null;
  }

  private ensureSeededFromSentenceStructure() {
    if (this.autoSeeded) return;
    const tab = this.getGrammarConceptsTab();
    if (!tab) return;
    const raw = (tab.json ?? '').trim();
    if (raw) {
      const parsed = this.safeParseObject(raw);
      if (!parsed) {
        return;
      }
      const items = Array.isArray(parsed['items']) ? parsed['items'] : [];
      if (items.length) {
        this.autoSeeded = true;
        return;
      }
      if (!this.isAutoSeedablePayload(parsed)) {
        this.autoSeeded = true;
        return;
      }
    }
    const derived = this.derivedConcepts;
    if (!derived.length) return;
    this.writeItems(this.mapDerivedToItems(derived));
    this.autoSeeded = true;
  }

  private buildGrammarConceptPayload(): Record<string, unknown> {
    const items = this.mapDerivedToItems(this.derivedConcepts);
    return {
      schema_version: 1,
      task_type: 'grammar_concepts',
      source: 'sentence_structure',
      items,
    };
  }

  private writeItems(items: GrammarConceptItem[]) {
    const tab = this.tab;
    if (!tab) return;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(tab.json || '{}') as Record<string, unknown>;
    } catch {
      payload = {};
    }
    payload['schema_version'] = payload['schema_version'] ?? 1;
    payload['task_type'] = 'grammar_concepts';
    payload['source'] = payload['source'] ?? 'sentence_structure';
    payload['items'] = items;
    tab.json = JSON.stringify(payload, null, 2);
  }

  private safeParseObject(raw: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private isAutoSeedablePayload(payload: Record<string, unknown>): boolean {
    const keys = Object.keys(payload);
    if (!keys.length) return true;
    const allowed = new Set(['schema_version', 'task_type', 'source', 'items']);
    if (!keys.every((key) => allowed.has(key))) return false;
    const items = payload['items'];
    if (Array.isArray(items) && items.length) return false;
    return true;
  }

  private mapDerivedToItems(concepts: DerivedGrammarConcept[]): GrammarConceptItem[] {
    return concepts.map((concept) => ({
      grammar_id: concept.grammar_id ?? null,
      ar_u_grammar: concept.ar_u_grammar ?? null,
      label: concept.label ?? null,
      sentences: concept.sentences.map((sentence) => ({
        sentence_order: sentence.sentence_order ?? null,
        ayah: sentence.ayah ?? null,
        text: sentence.text ?? null,
      })),
    }));
  }

  private toConceptGroups(items: GrammarConceptItem[]): ConceptGroup[] {
    const groups = items.map((item, index) => {
      const label = this.asString(item.label) ?? item.grammar_id ?? item.ar_u_grammar ?? 'Grammar Concept';
      const sentencesRaw = Array.isArray(item.sentences) ? item.sentences : [];
      const sentenceRefs = sentencesRaw.map((sentence) => ({
        sentence_order: this.asNumber(sentence.sentence_order),
        ayah: this.asNumber(sentence.ayah),
        text: this.asString(sentence.text) ?? '',
      }));
      const sentences = this.sortAndDedupeSentences(sentenceRefs);
      return {
        label,
        sentences,
        itemIndex: index,
      };
    });
    return groups.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
  }

  private extractGrammarConcepts(items: Array<Record<string, unknown>>): DerivedGrammarConcept[] {
    const concepts = new Map<string, DerivedGrammarConcept>();
    const sentenceDedup = new Map<string, Set<string>>();

    for (const item of items) {
      const sentenceText = this.resolveCanonicalSentence(item);
      const sentenceOrder = this.asNumber(item['sentence_order']);
      const ayah = this.asNumber(item['ayah']);
      const refs = this.extractGrammarRefsFromItem(item);
      for (const ref of refs) {
        const key = this.buildGrammarKey(ref);
        if (!key) continue;
        let concept = concepts.get(key);
        if (!concept) {
          concept = {
            grammar_id: ref.grammar_id ?? null,
            ar_u_grammar: ref.ar_u_grammar ?? null,
            label: ref.label ?? ref.grammar_id ?? ref.ar_u_grammar ?? 'Grammar Concept',
            sentences: [],
          };
          concepts.set(key, concept);
          sentenceDedup.set(key, new Set());
        } else if (!concept.label && ref.label) {
          concept.label = ref.label;
        }

        const sentenceKey =
          sentenceOrder != null
            ? `order:${sentenceOrder}`
            : ayah != null
              ? `ayah:${ayah}`
              : sentenceText
                ? `text:${sentenceText}`
                : '';
        if (sentenceKey) {
          const seen = sentenceDedup.get(key);
          if (seen && !seen.has(sentenceKey)) {
            seen.add(sentenceKey);
            concept.sentences.push({
              sentence_order: sentenceOrder,
              ayah,
              text: sentenceText,
            });
          }
        }
      }
    }

    return Array.from(concepts.values());
  }

  private extractGrammarRefsFromItem(item: Record<string, unknown>): GrammarRef[] {
    const refs: GrammarRef[] = [];
    this.collectGrammarRefs(item['steps'], refs);
    this.collectGrammarRefs(item['grammar_flow'], refs);
    const summary = item['structure_summary'];
    if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
      this.collectGrammarRefs((summary as Record<string, unknown>)['grammar_flow'], refs);
      this.collectGrammarFromSummary(summary as Record<string, unknown>, refs);
    }
    return refs;
  }

  private collectGrammarFromSummary(summary: Record<string, unknown>, out: GrammarRef[]) {
    const main = Array.isArray(summary['main_components']) ? summary['main_components'] : [];
    for (const component of main) {
      const compRecord = this.asRecord(component);
      if (!compRecord) continue;
      this.collectGrammarRefs(compRecord['grammar'], out);
    }
    const expansions = Array.isArray(summary['expansions']) ? summary['expansions'] : [];
    for (const expansion of expansions) {
      const expRecord = this.asRecord(expansion);
      if (!expRecord) continue;
      this.collectGrammarRefs(expRecord['grammar'], out);
    }
  }

  private collectGrammarRefs(list: unknown, out: GrammarRef[]) {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      const ref = this.extractGrammarRef(entry);
      if (ref) out.push(ref);
    }
  }

  private extractGrammarRef(entry: unknown): GrammarRef | null {
    if (typeof entry === 'string') {
      return this.parseGrammarString(entry);
    }
    const record = this.asRecord(entry);
    if (!record) return null;
    const arUGrammar = this.asString(record['ar_u_grammar']);
    const grammarRaw =
      this.asString(record['grammar_id']) ??
      this.asString(record['id']) ??
      this.asString(record['grammar']);
    const label =
      this.asString(record['title']) ??
      this.asString(record['label']) ??
      this.asString(record['name']);

    if (arUGrammar) {
      const parsed = this.parseGrammarString(arUGrammar);
      return { ...parsed, label: label ?? parsed.label ?? null };
    }
    if (grammarRaw) {
      const parsed = this.parseGrammarString(grammarRaw);
      return { ...parsed, label: label ?? parsed.label ?? null };
    }
    return null;
  }

  private parseGrammarString(value: string): GrammarRef {
    const trimmed = value.trim();
    if (!trimmed) return { grammar_id: null, ar_u_grammar: null, label: null };
    if (this.isLikelyArUGrammar(trimmed)) {
      return { grammar_id: null, ar_u_grammar: trimmed, label: null };
    }
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('gram|') || lower.startsWith('grammar|')) {
      const parts = trimmed.split('|');
      const last = parts[parts.length - 1];
      if (last && last !== trimmed) {
        return { grammar_id: last, ar_u_grammar: null, label: null };
      }
    }
    return { grammar_id: trimmed, ar_u_grammar: null, label: null };
  }

  private buildGrammarKey(ref: GrammarRef): string | null {
    if (ref.ar_u_grammar) return `aru:${ref.ar_u_grammar}`;
    if (ref.grammar_id) return `gram:${ref.grammar_id}`;
    if (ref.label) return `label:${ref.label}`;
    return null;
  }

  private resolveCanonicalSentence(item: Record<string, unknown>): string {
    const direct = this.asString(item['canonical_sentence']);
    if (direct) return direct;
    const summary = item['structure_summary'];
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return '';
    const fullText = this.asString((summary as Record<string, unknown>)['full_text']);
    return fullText ?? '';
  }

  private sortAndDedupeSentences(sentences: SentenceRef[]): string[] {
    const cleaned = sentences
      .map((sentence) => ({
        text: sentence.text?.trim() ?? '',
        order: sentence.sentence_order ?? null,
        ayah: sentence.ayah ?? null,
      }))
      .filter((sentence) => sentence.text);
    cleaned.sort((a, b) => {
      if (a.ayah != null && b.ayah != null && a.ayah !== b.ayah) return a.ayah - b.ayah;
      if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
      return a.text.localeCompare(b.text, 'ar');
    });
    const seen = new Set<string>();
    const out: string[] = [];
    for (const sentence of cleaned) {
      if (seen.has(sentence.text)) continue;
      seen.add(sentence.text);
      out.push(sentence.text);
    }
    return out;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private isLikelyArUGrammar(value: string): boolean {
    return /^[a-f0-9]{64}$/i.test(value);
  }
}

type GrammarRef = {
  grammar_id: string | null;
  ar_u_grammar: string | null;
  label: string | null;
};

type GrammarConceptSentence = {
  sentence_order?: number | string | null;
  ayah?: number | string | null;
  text?: string | null;
};

type GrammarConceptItem = {
  grammar_id?: string | null;
  ar_u_grammar?: string | null;
  label?: string | null;
  sentences?: GrammarConceptSentence[] | null;
};

type SentenceRef = {
  sentence_order: number | null;
  ayah: number | null;
  text: string;
};

type DerivedGrammarConcept = {
  grammar_id: string | null;
  ar_u_grammar: string | null;
  label: string;
  sentences: SentenceRef[];
};

type ConceptGroup = {
  label: string;
  sentences: string[];
  itemIndex: number;
};
