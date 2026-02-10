import { EditorState } from '../models/editor.types';

export function setStatus(state: EditorState, tone: EditorState['statusTone'], message: string) {
  state.statusTone = tone;
  state.statusMessage = message;
}

export function setSaving(state: EditorState, key: 'lesson' | 'container', value: boolean) {
  if (key === 'lesson') {
    state.savingLesson = value;
  } else {
    state.savingContainer = value;
  }
}

export function setRange(state: EditorState, start: number | null, end: number | null) {
  state.rangeStart = start;
  state.rangeEnd = end;
}

export function setReferenceLocked(state: EditorState, locked: boolean) {
  state.referenceLocked = locked;
  if (locked && state.unlockedStepIndex < 1) {
    state.unlockedStepIndex = 1;
  }
}

export function setLessonLocked(state: EditorState, locked: boolean) {
  state.lessonLocked = locked;
  if (locked && state.unlockedStepIndex < 3) {
    state.unlockedStepIndex = 3;
  }
}

export function setUnlockedStep(state: EditorState, index: number) {
  if (index > state.unlockedStepIndex) {
    state.unlockedStepIndex = index;
  }
}
