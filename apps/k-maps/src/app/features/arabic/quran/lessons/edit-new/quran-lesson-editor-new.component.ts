import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorState, TaskTab, TaskType } from './models/editor.types';
import { formatWordLabel, formatWordTitle } from './domain/word-format';
import { QuranLessonEditorFacade } from './facade/editor.facade';
import {
  selectActiveStep,
  selectFilteredSurahs,
  selectRangeValid,
  selectReferenceLabel,
  selectSelectedAyahs,
  selectSelectedRangeLabel,
  selectSelectedRangeLabelShort,
  selectStepLocked,
  selectSurahName,
  isAyahSelected as isAyahSelectedSelector,
} from './state/editor.selectors';

@Component({
  selector: 'app-quran-lesson-editor-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quran-lesson-editor-new.component.html',
  styleUrls: ['./quran-lesson-editor-new.component.scss'],
  providers: [QuranLessonEditorFacade],
})
export class QuranLessonEditorNewComponent implements OnInit {
  private readonly facade = inject(QuranLessonEditorFacade);
  readonly difficultyLevels = [1, 2, 3, 4, 5];

  ngOnInit() {
    this.facade.init();
  }

  get state(): EditorState {
    return this.facade.state;
  }

  get activeStep() {
    return selectActiveStep(this.facade.state);
  }

  get filteredSurahs() {
    return selectFilteredSurahs(this.facade.state);
  }

  get selectedRangeLabel() {
    return selectSelectedRangeLabel(this.facade.state);
  }

  get rangeLabelShort() {
    return selectSelectedRangeLabelShort(this.facade.state);
  }

  get surahName() {
    return selectSurahName(this.facade.state);
  }

  get referenceLabel() {
    return selectReferenceLabel(this.facade.state);
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
  }

  get rangeValid() {
    return selectRangeValid(this.facade.state);
  }

  get activeTaskTab(): TaskTab | null {
    return this.facade.getActiveTaskTab();
  }

  selectStep(index: number) {
    this.facade.selectStep(index);
  }

  clearDraft() {
    this.facade.clearDraft();
  }

  back() {
    this.facade.back();
  }

  onSurahChange() {
    this.facade.onSurahChange();
  }

  onSurahQueryChange() {
    this.facade.onSurahQueryChange();
  }

  setStart(ayah: { ayah: number }) {
    this.facade.setStart(ayah);
  }

  setEnd(ayah: { ayah: number }) {
    this.facade.setEnd(ayah);
  }

  clearRange() {
    this.facade.clearRange();
  }

  onRangeStartChange(value: number | null) {
    this.facade.setRangeStartValue(value);
  }

  onRangeEndChange(value: number | null) {
    this.facade.setRangeEndValue(value);
  }

  lockReference() {
    this.facade.lockReference();
  }

  continueToLesson() {
    this.facade.continueToLesson();
  }

  saveLessonMeta() {
    this.facade.saveLessonMeta();
  }

  wordLabel(word: any) {
    return formatWordLabel(word);
  }

  wordTitle(word: any) {
    return formatWordTitle(word);
  }

  isAyahSelected(ayah: any) {
    return isAyahSelectedSelector(this.facade.state, ayah);
  }

  isStepLocked(index: number) {
    return selectStepLocked(this.facade.state, index);
  }

  setDifficulty(level: number) {
    this.facade.setDifficulty(level);
  }

  selectTaskTab(type: TaskType) {
    this.facade.selectTaskTab(type);
  }

  saveTask(type: TaskType) {
    this.facade.saveTask(type);
  }

  trackByTaskType(_index: number, tab: TaskTab) {
    return tab.type;
  }
}
