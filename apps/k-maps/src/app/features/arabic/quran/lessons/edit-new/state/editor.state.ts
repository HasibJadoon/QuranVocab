import { EditorState, EditorStep, TaskTab, TaskType } from '../models/editor.types';

export const EDITOR_STEPS: EditorStep[] = [
  { id: 'container', label: 'Container', intent: 'Select the canonical Qur\'anic reference.' },
  { id: 'unit', label: 'Unit', intent: 'Confirm the raw passage slice (no pedagogy).' },
  { id: 'lesson', label: 'Lesson', intent: 'Add lesson metadata that wraps the unit.' },
  { id: 'tasks', label: 'Tasks', intent: 'Add teaching steps attached to the unit.' },
];

const TASK_TAB_DEFS: Array<{ type: TaskType; label: string }> = [
  { type: 'reading', label: 'Reading' },
  { type: 'sentence_structure', label: 'Sentence Structure' },
  { type: 'morphology', label: 'Morphology' },
  { type: 'grammar_concepts', label: 'Grammar Concepts' },
  { type: 'expressions', label: 'Expressions' },
  { type: 'comprehension', label: 'Comprehension' },
  { type: 'passage_structure', label: 'Passage Structure' },
];

export function buildTaskTabs(): TaskTab[] {
  return TASK_TAB_DEFS.map((tab) => ({ ...tab, json: '' }));
}

export function createEditorState(): EditorState {
  return {
    lessonId: null,
    isNew: true,

    surahs: [],
    surahQuery: '',
    selectedSurah: null,
    ayahs: [],
    loadingAyahs: false,
    ayahError: '',

    rangeStart: null,
    rangeEnd: null,
    containerId: null,
    passageUnitId: null,
    referenceLocked: false,

    steps: EDITOR_STEPS,
    activeStepIndex: 0,
    unlockedStepIndex: 0,

    lessonTitleEn: '',
    lessonTitleAr: '',
    lessonSubtype: '',
    lessonDifficulty: null,
    lessonLocked: false,
    lessonJsonRaw: '',

    taskTabs: buildTaskTabs(),
    activeTaskType: 'reading',
    taskSavingType: null,

    statusMessage: '',
    statusTone: 'idle',
    savingLesson: false,
    savingContainer: false,
  };
}

export function resetEditorState(state: EditorState) {
  Object.assign(state, createEditorState());
}
