import { QuranAyah, QuranSurah } from '../../../../../../shared/models/arabic/quran-data.model';

export type EditorStepId = 'container' | 'unit' | 'lesson' | 'tasks';

export type EditorStep = {
  id: EditorStepId;
  label: string;
  intent: string;
};

export type TaskType =
  | 'reading'
  | 'sentence_structure'
  | 'morphology'
  | 'grammar_concepts'
  | 'expressions'
  | 'comprehension'
  | 'passage_structure';

export type SentenceSubTab = 'verses' | 'items' | 'json';

export type SentenceCandidate = {
  id: string;
  text: string;
  ayah: number | null;
  source: 'ayah' | 'selection' | 'ai';
};

export type TaskTab = {
  type: TaskType;
  label: string;
  json: string;
};

export type EditorStatusTone = 'info' | 'success' | 'error' | 'idle';

export type EditorState = {
  lessonId: string | null;
  isNew: boolean;

  surahs: QuranSurah[];
  surahQuery: string;
  selectedSurah: number | null;
  ayahs: QuranAyah[];
  loadingAyahs: boolean;
  ayahError: string;

  rangeStart: number | null;
  rangeEnd: number | null;

  containerId: string | null;
  passageUnitId: string | null;
  referenceLocked: boolean;

  steps: EditorStep[];
  activeStepIndex: number;
  unlockedStepIndex: number;

  lessonTitleEn: string;
  lessonTitleAr: string;
  lessonSubtype: string;
  lessonDifficulty: number | null;
  lessonLocked: boolean;
  lessonJsonRaw: string;

  taskTabs: TaskTab[];
  activeTaskType: TaskType;
  taskSavingType: TaskType | null;

  sentenceSubTab: SentenceSubTab;
  sentenceAyahSelections: number[];
  sentenceLoadedAyahs: number[];
  sentenceCandidates: SentenceCandidate[];
  sentenceResolvingId: string | null;

  statusMessage: string;
  statusTone: EditorStatusTone;
  savingLesson: boolean;
  savingContainer: boolean;
};
