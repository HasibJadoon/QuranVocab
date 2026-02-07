export type BuilderTabId =
  | 'meta'
  | 'verses'
  | 'container'
  | 'units'
  | 'tokens'
  | 'morphology'
  | 'spans'
  | 'sentences'
  | 'grammar'
  | 'tree'
  | 'content'
  | 'review'
  | 'dev';

export type BuilderTab = {
  id: BuilderTabId;
  label: string;
  intent: string;
};

export type BuilderTabState = 'todo' | 'ready' | 'active' | 'done' | 'locked' | 'error';

export type VerseNavItem = {
  unit_id: string;
  surah: number;
  ayah: number;
};

export type ValidationItem = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type VerseSelection = {
  surah: number;
  ayahFrom: number;
  ayahTo: number;
};
