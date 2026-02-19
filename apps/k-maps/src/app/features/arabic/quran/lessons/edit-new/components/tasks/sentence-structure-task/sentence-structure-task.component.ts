import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AppJsonCodeEditorComponent,
  AppJsonEditorModalComponent,
  AppTabsComponent,
  type AppTabItem,
} from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, SentenceCandidate, SentenceSubTab, TaskType } from '../../../models/editor.types';
import { selectSelectedAyahs } from '../../../state/editor.selectors';

@Component({
  selector: 'app-sentence-structure-task',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent, AppJsonEditorModalComponent, AppJsonCodeEditorComponent],
  templateUrl: './sentence-structure-task.component.html',
})
export class SentenceStructureTaskComponent implements OnInit {
  private readonly facade = inject(QuranLessonEditorFacade);
  @Input() readOnly = false;
  private fontRem = 1.35;
  private readonly minFontRem = 1;
  private readonly maxFontRem = 2.4;
  readonly sentenceTabs: AppTabItem[] = [
    { id: 'verses', label: 'Verse Selection' },
    { id: 'items', label: 'Sentence Items' },
    { id: 'json', label: 'Task JSON' },
  ];
  editModalOpen = false;
  editModalIndex: number | null = null;
  editModalJson = '';
  editModalError = '';
  editModalTitle = 'Sentence JSON';
  editModalPlaceholder = JSON.stringify(
    {
      sentence_order: 1,
      canonical_sentence: '...',
      source: 'selection',
      ayah: 1,
      text_norm: '',
      ar_u_sentence: null,
      structure_summary: this.buildStructureSummary('...'),
    },
    null,
    2
  );
  editingIndex: number | null = null;
  editingValue = '';
  contextMenuOpen = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuSelection = '';
  contextMenuAyahText = '';
  contextMenuAyahNumber: number | null = null;

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
  }

  get sentenceItems() {
    return this.facade.getSentenceItems();
  }

  get arabicFontSize(): string {
    return `${this.fontRem.toFixed(2)}rem`;
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

  ngOnInit() {
    const stored = this.readStoredFontSize();
    if (stored == null) return;
    this.fontRem = stored;
  }

  trackBySentenceItem(index: number, item: any) {
    if (item && typeof item === 'object') {
      const order = (item as Record<string, unknown>)['sentence_order'];
      if (typeof order === 'number' || typeof order === 'string') {
        return order;
      }
      const key = (item as Record<string, unknown>)['ar_u_sentence'];
      if (typeof key === 'string') return key;
      const text = (item as Record<string, unknown>)['canonical_sentence'];
      if (typeof text === 'string') return text;
    }
    return index;
  }

  get sentenceJson(): string {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    return tab?.json ?? '';
  }

  set sentenceJson(value: string) {
    if (this.readOnly) return;
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;
    tab.json = value;
  }

  onSentenceTabChange(tab: AppTabItem) {
    this.facade.selectSentenceSubTab(tab.id as SentenceSubTab);
  }

  extractSentenceCandidates() {
    if (this.readOnly) return;
    this.facade.extractSentenceCandidates();
  }

  addSelectionFromPreview() {
    if (this.readOnly) return;
    const selection = window.getSelection ? window.getSelection() : null;
    const text = selection?.toString() ?? '';
    this.facade.addSentenceTextToTask(text, null, 'selection');
  }

  sentenceAyahText(ayah: any) {
    return this.facade.getPlainAyahText(ayah);
  }

  openContextMenu(event: MouseEvent, ayah?: any) {
    if (this.readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    const selection = window.getSelection ? window.getSelection() : null;
    const selectedText = selection?.toString() ?? '';
    const ayahText = ayah ? this.sentenceAyahText(ayah) : '';
    const menuWidth = 240;
    const menuHeight = 140;
    const viewportW = window.innerWidth || 0;
    const viewportH = window.innerHeight || 0;
    let x = Math.max(16, (viewportW - menuWidth) / 2);
    let y = Math.max(16, (viewportH - menuHeight) / 2);
    if (viewportW && x + menuWidth > viewportW) {
      x = Math.max(16, viewportW - menuWidth - 16);
    }
    if (viewportH && y + menuHeight > viewportH) {
      y = Math.max(16, viewportH - menuHeight - 16);
    }

    this.contextMenuSelection = selectedText.trim();
    this.contextMenuAyahText = ayahText;
    this.contextMenuAyahNumber = ayah?.ayah ?? null;
    this.contextMenuX = x;
    this.contextMenuY = y;
    this.contextMenuOpen = true;
  }

  addContextSelection() {
    if (this.readOnly) return;
    if (!this.contextMenuSelection) return;
    this.facade.addSentenceTextToTask(this.contextMenuSelection, this.contextMenuAyahNumber, 'selection');
    this.closeContextMenu();
  }

  addContextAyah() {
    if (this.readOnly) return;
    if (!this.contextMenuAyahText) return;
    this.facade.addSentenceTextToTask(this.contextMenuAyahText, this.contextMenuAyahNumber, 'ayah');
    this.closeContextMenu();
  }

  closeContextMenu() {
    this.contextMenuOpen = false;
    this.contextMenuSelection = '';
    this.contextMenuAyahText = '';
    this.contextMenuAyahNumber = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.contextMenuOpen) {
      this.closeContextMenu();
    }
  }

  openEditModal(item: any, index: number) {
    if (this.readOnly) return;
    this.editModalIndex = index;
    const base = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    this.editModalJson = JSON.stringify(this.withStructureSummary({ ...base }), null, 2);
    this.editModalError = '';
    this.editModalTitle = 'Sentence JSON';
    this.editModalOpen = true;
  }

  openCreateModal() {
    if (this.readOnly) return;
    this.editModalIndex = -1;
    this.editModalJson = JSON.stringify(this.buildSentenceTemplate(), null, 2);
    this.editModalError = '';
    this.editModalTitle = 'Add Sentence JSON';
    this.editModalOpen = true;
  }

  openPasteSentenceModal() {
    if (this.readOnly) return;
    this.editModalIndex = -1;
    this.editModalJson = '';
    this.editModalError = '';
    this.editModalTitle = 'Paste Sentence JSON';
    this.editModalOpen = true;
  }

  startEditSentence(item: any, index: number) {
    if (this.readOnly) return;
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const current = typeof record['canonical_sentence'] === 'string' ? record['canonical_sentence'] : '';
    this.editingIndex = index;
    this.editingValue = current;
  }

  saveEditSentence(index: number) {
    if (this.readOnly) return;
    if (this.editingIndex !== index) return;
    this.facade.updateSentenceItem(index, this.editingValue);
    this.cancelEditSentence();
  }

  cancelEditSentence() {
    this.editingIndex = null;
    this.editingValue = '';
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editModalIndex = null;
    this.editModalJson = '';
    this.editModalError = '';
  }

  submitEditModal() {
    if (this.readOnly) return;
    if (this.editModalIndex == null) return;
    let parsed: unknown;
    const trimmed = this.editModalJson.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch (err: any) {
      const fallback = this.tryParseStructureSummarySnippet(trimmed);
      if (!fallback) {
        this.editModalError = err?.message ?? 'Invalid JSON.';
        return;
      }
      parsed = fallback;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.editModalError = 'Sentence JSON must be an object.';
      return;
    }
    let record = parsed as Record<string, unknown>;
    if (this.isStructureSummaryOnly(record)) {
      const base = this.getSentenceBase();
      record = { ...base, ...record };
    } else if (this.isLikelyStructureSummaryPayload(record) && !('structure_summary' in record)) {
      const base = this.getSentenceBase();
      record = { ...base, structure_summary: record };
    }
    const summaryFullText = this.extractSummaryFullText(record);
    const canonical =
      typeof record['canonical_sentence'] === 'string' ? record['canonical_sentence'].trim() : '';
    if (!canonical && summaryFullText) {
      record['canonical_sentence'] = summaryFullText;
    }
    const sentence =
      typeof record['canonical_sentence'] === 'string' ? record['canonical_sentence'].trim() : '';
    if (!sentence) {
      this.editModalError = 'canonical_sentence is required.';
      return;
    }
    if (this.editModalIndex < 0) {
      this.facade.addSentenceItemRecord(record);
    } else {
      this.facade.replaceSentenceItem(this.editModalIndex, record);
    }
    this.closeEditModal();
  }

  addSentenceCandidateToTask(candidate: SentenceCandidate) {
    if (this.readOnly) return;
    this.facade.addSentenceCandidateToTask(candidate);
  }

  removeSentenceItem(index: number) {
    if (this.readOnly) return;
    this.facade.removeSentenceItem(index);
  }

  validateTaskJson() {
    if (this.readOnly) return;
    this.facade.validateTaskJson('sentence_structure');
  }

  formatTaskJson() {
    if (this.readOnly) return;
    this.facade.formatTaskJson('sentence_structure');
  }

  commitTask() {
    if (this.readOnly) return;
    this.facade.saveTask('sentence_structure' as TaskType);
  }

  private buildSentenceTemplate() {
    return {
      sentence_order: null,
      canonical_sentence: '',
      source: 'manual',
      ayah: null,
      text_norm: '',
      ar_u_sentence: null,
      structure_summary: this.buildStructureSummary(''),
    };
  }

  private buildStructureSummary(fullText: string) {
    return {
      sentence_type: '',
      full_text: fullText,
      core_pattern: '',
      main_components: [
        {
          component: '',
          text: '',
          pattern: '',
          role: '',
          grammar: [],
        },
      ],
      expansions: [
        {
          type: '',
          text: '',
          function: '',
          grammar: [],
        },
      ],
    };
  }

  private withStructureSummary(record: Record<string, unknown>) {
    const canonical = typeof record['canonical_sentence'] === 'string' ? record['canonical_sentence'] : '';
    const current = record['structure_summary'];
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return { ...record, structure_summary: this.buildStructureSummary(canonical) };
    }
    const summary = { ...(current as Record<string, unknown>) };
    if (typeof summary['full_text'] !== 'string' || !summary['full_text'].trim()) {
      summary['full_text'] = canonical;
    }
    return { ...record, structure_summary: summary };
  }

  private tryParseStructureSummarySnippet(raw: string): Record<string, unknown> | null {
    if (!raw) return null;
    if (/^"structure_summary"\s*:/.test(raw)) {
      try {
        return JSON.parse(`{${raw}}`) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }

  private isStructureSummaryOnly(record: Record<string, unknown>) {
    const keys = Object.keys(record);
    return keys.length === 1 && keys[0] === 'structure_summary';
  }

  private extractSummaryFullText(record: Record<string, unknown>) {
    const summary = record['structure_summary'];
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return '';
    const fullText = (summary as Record<string, unknown>)['full_text'];
    return typeof fullText === 'string' ? fullText.trim() : '';
  }

  private isLikelyStructureSummaryPayload(record: Record<string, unknown>) {
    return (
      'sentence_type' in record ||
      'full_text' in record ||
      'core_pattern' in record ||
      'main_components' in record ||
      'expansions' in record
    );
  }

  private getSentenceBase(): Record<string, unknown> {
    if (this.editModalIndex != null && this.editModalIndex >= 0) {
      const existing = this.sentenceItems[this.editModalIndex];
      if (existing && typeof existing === 'object') {
        return this.withStructureSummary({ ...(existing as Record<string, unknown>) });
      }
    }
    return this.buildSentenceTemplate();
  }

  private get storageKey(): string {
    const lessonId = this.state.lessonId ?? 'global';
    return `km:quran:lesson-font:${lessonId}:sentence_structure`;
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
}
