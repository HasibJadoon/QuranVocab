import { QuranLessonCommitStep } from '../../../../../../shared/services/quran-lesson.service';
import { BuilderTab, BuilderTabId } from '../components/lesson-builder.types';

export const DRAFT_KEY_PREFIX = 'km:quran-lesson-builder:draft';
export const DRAFT_ID_KEY_PREFIX = 'km:quran-lesson-builder:draft-id';


export const BUILDER_TABS: BuilderTab[] = [
  { id: 'meta', label: 'Lesson Info', intent: 'Create lesson envelope first' },
  { id: 'verses', label: 'Select Verses', intent: 'Pick surah + ayah range and preview' },
  { id: 'container', label: 'Create Container + Passage Unit', intent: 'Build lesson container foundation' },
  { id: 'units', label: 'Attach Verse Units', intent: 'Ensure every verse unit is linked' },
  { id: 'tokens', label: 'Tokens + Lemmas', intent: 'Fix token alignment and lemma locations' },
  { id: 'morphology', label: 'Morphology', intent: 'Capture noun/verb morphology per verse' },
  { id: 'spans', label: 'Spans / Expressions', intent: 'Build span layer from tokens' },
  { id: 'sentences', label: 'Sentences Builder', intent: 'Create occurrence sentences from token ranges' },
  { id: 'grammar', label: 'Grammar Concepts', intent: 'Link grammar to token/span/sentence targets' },
  { id: 'tree', label: 'Sentence Tree', intent: 'Build clause graph per sentence occurrence' },
  { id: 'content', label: 'MCQs + Questions', intent: 'Author lesson overlays' },
  { id: 'review', label: 'Validate + Publish', intent: 'Run checks before publish' },
  { id: 'dev', label: 'Raw JSON / Tools', intent: 'Use low-level JSON and debug helpers' },
];


export type DraftCommitStep = 'meta' | 'units' | 'sentences' | 'comprehension' | 'notes';

export const DRAFT_COMMIT_STEP_BY_TAB: Partial<Record<BuilderTabId, DraftCommitStep>> = {
  meta: 'meta',
  units: 'units',
  sentences: 'sentences',
  content: 'comprehension',
  review: 'notes',
};

export const LEGACY_COMMIT_STEP_BY_TAB: Partial<Record<BuilderTabId, QuranLessonCommitStep>> = {
  container: 'container',
  tokens: 'tokens',
  morphology: 'tokens',
  spans: 'spans',
  grammar: 'grammar',
};
