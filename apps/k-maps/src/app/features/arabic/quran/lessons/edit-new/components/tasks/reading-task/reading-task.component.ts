import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { QuranLessonEditorFacade } from '../../../facade/editor.facade';
import { EditorState } from '../../../models/editor.types';
import { selectSelectedAyahs } from '../../../state/editor.selectors';

@Component({
  selector: 'app-reader-task',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reading-task.component.html',
})
export class ReaderTaskComponent implements OnInit {
  private readonly facade = inject(QuranLessonEditorFacade);
  @Input() readOnly = false;
  private fontRem = 1.35;
  private readonly minFontRem = 1;
  private readonly maxFontRem = 2.4;

  get state(): EditorState {
    return this.facade.state;
  }

  get selectedAyahs() {
    return selectSelectedAyahs(this.facade.state);
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

  save() {
    this.facade.saveTask('reading');
  }

  ngOnInit() {
    const stored = this.readStoredFontSize();
    if (stored == null) return;
    this.fontRem = stored;
  }

  private get storageKey(): string {
    const lessonId = this.state.lessonId ?? 'global';
    return `km:quran:lesson-font:${lessonId}:reading`;
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
