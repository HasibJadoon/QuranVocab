import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppTabsComponent, type AppTabItem } from '../../../../../../../../shared/components';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState, SentenceCandidate, SentenceSubTab, TaskType } from '../../../models/editor.types';
import { selectSelectedAyahs, selectSelectedRangeLabelShort } from '../../../state/editor.selectors';

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

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.facade.state);
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

  toggleSentenceAyah(ayah: number) {
    this.facade.toggleSentenceAyah(ayah);
  }

  selectAllSentenceAyahs() {
    this.facade.selectAllSentenceAyahs();
  }

  clearSentenceAyahs() {
    this.facade.clearSentenceAyahs();
  }

  loadSentenceVerses() {
    this.facade.loadSentenceVerses();
  }

  extractSentenceCandidates() {
    this.facade.extractSentenceCandidates();
  }

  addSelectionFromPreview() {
    const selection = window.getSelection ? window.getSelection() : null;
    const text = selection?.toString() ?? '';
    this.facade.addSelectionAsSentence(text);
  }

  sentenceAyahText(ayah: any) {
    return this.facade.getPlainAyahText(ayah);
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
