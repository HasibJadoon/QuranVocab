import { QuranAyah, QuranSurah } from '../../../../../../shared/models/arabic/quran-data.model';
import { normalizeSurahQuery } from '../domain/normalize-surah-query';
import { EditorState, EditorStep } from '../models/editor.types';

export function selectActiveStep(state: EditorState): EditorStep {
  return state.steps[state.activeStepIndex] ?? state.steps[0]!;
}

export function selectSelectedRangeLabel(state: EditorState): string {
  if (state.rangeStart == null) return 'No range selected';
  if (state.rangeEnd == null || state.rangeEnd === state.rangeStart) {
    return `Ayah ${state.rangeStart}`;
  }
  return `Ayah ${state.rangeStart} - ${state.rangeEnd}`;
}

export function selectSelectedRangeLabelShort(state: EditorState): string {
  if (state.rangeStart == null) return '--';
  const end = state.rangeEnd ?? state.rangeStart;
  if (end === state.rangeStart) return `${state.rangeStart}`;
  return `${state.rangeStart}-${end}`;
}

export function selectSelectedAyahs(state: EditorState): QuranAyah[] {
  if (state.rangeStart == null) return [];
  const end = state.rangeEnd ?? state.rangeStart;
  const min = Math.min(state.rangeStart, end);
  const max = Math.max(state.rangeStart, end);
  return state.ayahs.filter((ayah) => ayah.ayah >= min && ayah.ayah <= max);
}

export function isAyahSelected(state: EditorState, ayah: QuranAyah): boolean {
  if (state.rangeStart == null) return false;
  if (state.rangeEnd == null) return ayah.ayah === state.rangeStart;
  const min = Math.min(state.rangeStart, state.rangeEnd);
  const max = Math.max(state.rangeStart, state.rangeEnd);
  return ayah.ayah >= min && ayah.ayah <= max;
}

export function selectGeneratedContainerTitle(state: EditorState): string {
  if (!state.selectedSurah || state.rangeStart == null) return 'Surah 1 1-7';
  const ayahFrom = state.rangeStart;
  const ayahTo = state.rangeEnd ?? state.rangeStart;
  return `Surah ${state.selectedSurah} ${ayahFrom}-${ayahTo}`;
}

export function selectSurahName(state: EditorState): string {
  if (!state.selectedSurah) return '--';
  const match = state.surahs.find((surah) => surah.surah === state.selectedSurah);
  return match?.name_ar ?? `Surah ${state.selectedSurah}`;
}

export function selectReferenceLabel(state: EditorState): string {
  if (!state.selectedSurah) return '--';
  return `S${state.selectedSurah}`;
}

export function selectRangeValid(state: EditorState): boolean {
  return state.selectedSurah != null && state.rangeStart != null && (state.rangeEnd ?? state.rangeStart) >= state.rangeStart;
}

export function selectReferenceSummary(state: EditorState) {
  return {
    surah: state.selectedSurah,
    ayahFrom: state.rangeStart,
    ayahTo: state.rangeEnd ?? state.rangeStart,
  };
}

export function selectStepLocked(state: EditorState, index: number): boolean {
  return index < state.unlockedStepIndex;
}

export function selectFilteredSurahs(state: EditorState): QuranSurah[] {
  const query = normalizeSurahQuery(state.surahQuery);
  if (!query) return state.surahs;
  const digitQuery = query.replace(/[^0-9]/g, '');
  return state.surahs.filter((surah) => {
    if (digitQuery && String(surah.surah).startsWith(digitQuery)) return true;
    if (!surah.name_ar) return false;
    return surah.name_ar.includes(query);
  });
}
