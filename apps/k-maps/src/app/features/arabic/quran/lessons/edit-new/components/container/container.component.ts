import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuranLessonEditorFacade } from '../../facade/editor.facade';
import { formatWordLabel, formatWordTitle } from '../../domain/word-format';
import { EditorState } from '../../models/editor.types';
import {
  isAyahSelected as isAyahSelectedSelector,
  selectFilteredSurahs,
  selectRangeValid,
  selectReferenceLabel,
  selectSelectedAyahs,
  selectSelectedRangeLabel,
  selectSurahName,
} from '../../state/editor.selectors';

@Component({
  selector: 'app-quran-lesson-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './container.component.html',
})
export class ContainerComponent {
  private readonly facade = inject(QuranLessonEditorFacade);

  get state(): EditorState {
    return this.facade.state;
  }

  get filteredSurahs() {
    return selectFilteredSurahs(this.facade.state);
  }

  get selectedRangeLabel() {
    return selectSelectedRangeLabel(this.facade.state);
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

  wordLabel(word: any) {
    return formatWordLabel(word);
  }

  wordTitle(word: any) {
    return formatWordTitle(word);
  }

  isAyahSelected(ayah: any) {
    return isAyahSelectedSelector(this.facade.state, ayah);
  }
}
