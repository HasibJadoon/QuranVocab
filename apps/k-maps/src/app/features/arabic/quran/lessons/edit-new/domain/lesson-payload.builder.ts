import { EditorState } from '../models/editor.types';
export function buildLessonPayload(
  state: EditorState,
  includeContainer: boolean,
  extraLessonJson: Record<string, unknown> = {}
) {
  const meta = {
    title: state.lessonTitleEn.trim(),
    title_ar: state.lessonTitleAr.trim(),
    lesson_type: 'quran',
    subtype: state.lessonSubtype.trim(),
    difficulty: state.lessonDifficulty,
    source: 'quran',
  };

  const payload: Record<string, unknown> = {
    title: state.lessonTitleEn.trim(),
    title_ar: state.lessonTitleAr.trim(),
    subtype: state.lessonSubtype.trim(),
    difficulty: state.lessonDifficulty,
    source: 'quran',
    lesson_json: {
      ...extraLessonJson,
      meta,
    },
  };

  if (includeContainer) {
    if (state.containerId) payload['container_id'] = state.containerId;
    if (state.passageUnitId) payload['unit_id'] = state.passageUnitId;
  }

  return payload;
}
