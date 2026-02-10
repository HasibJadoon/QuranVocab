import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppTabsComponent, type AppTabItem } from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, SentenceCandidate, SentenceSubTab, TaskType } from '../../../models/editor.types';
import { selectSelectedAyahs } from '../../../state/editor.selectors';

@Component({
  selector: 'app-sentence-structure-task',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent],
  templateUrl: './sentence-structure-task.component.html',
})
export class SentenceStructureTaskComponent {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly sentenceTabs: AppTabItem[] = [
    { id: 'verses', label: 'Verse Selection' },
    { id: 'items', label: 'Sentence Items' },
    { id: 'json', label: 'Task JSON' },
  ];
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

  get sentenceJson(): string {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    return tab?.json ?? '';
  }

  set sentenceJson(value: string) {
    const tab = this.state.taskTabs.find((entry) => entry.type === 'sentence_structure');
    if (!tab) return;
    tab.json = value;
  }

  onSentenceTabChange(tab: AppTabItem) {
    this.facade.selectSentenceSubTab(tab.id as SentenceSubTab);
  }

  extractSentenceCandidates() {
    this.facade.extractSentenceCandidates();
  }

  addSelectionFromPreview() {
    const selection = window.getSelection ? window.getSelection() : null;
    const text = selection?.toString() ?? '';
    this.facade.addSentenceTextToTask(text, null, 'selection');
  }

  sentenceAyahText(ayah: any) {
    return this.facade.getPlainAyahText(ayah);
  }

  openContextMenu(event: MouseEvent, ayah?: any) {
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
    if (!this.contextMenuSelection) return;
    this.facade.addSentenceTextToTask(this.contextMenuSelection, this.contextMenuAyahNumber, 'selection');
    this.closeContextMenu();
  }

  addContextAyah() {
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

  startEditSentence(item: any, index: number) {
    this.editingIndex = index;
    this.editingValue = typeof item['canonical_sentence'] === 'string' ? String(item['canonical_sentence']) : '';
  }

  cancelEditSentence() {
    this.editingIndex = null;
    this.editingValue = '';
  }

  saveEditSentence(index: number) {
    this.facade.updateSentenceItem(index, this.editingValue);
    this.cancelEditSentence();
  }

  addSentenceCandidateToTask(candidate: SentenceCandidate) {
    this.facade.addSentenceCandidateToTask(candidate);
  }

  removeSentenceItem(index: number) {
    this.facade.removeSentenceItem(index);
  }

  validateTaskJson() {
    this.facade.validateTaskJson('sentence_structure');
  }

  formatTaskJson() {
    this.facade.formatTaskJson('sentence_structure');
  }

  commitTask() {
    this.facade.saveTask('sentence_structure' as TaskType);
  }
}
