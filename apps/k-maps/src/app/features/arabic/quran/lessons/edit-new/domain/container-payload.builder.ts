import { EditorState } from '../models/editor.types';

export function buildContainerPayload(state: EditorState, textCache: string, generatedTitle: string) {
  return {
    surah: state.selectedSurah,
    ayah_from: state.rangeStart,
    ayah_to: state.rangeEnd ?? state.rangeStart,
    title: generatedTitle,
    text_cache: textCache,
    unit_label: null,
    unit_meta: null,
  };
}
