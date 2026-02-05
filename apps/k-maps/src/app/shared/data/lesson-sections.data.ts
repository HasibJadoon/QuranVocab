import { LessonSection } from '../models/arabic/lesson-section.model';

export const SECTION_DATA: LessonSection[] = [
  {
    id: 'quran-reading',
    title: 'Reading',
    description: 'Read the ayat with guided markers and pronunciation support.',
    feature: 'quran',
    mode: 'original',
  },
  {
    id: 'quran-memory',
    title: 'Memory',
    description: 'Memorization-focused sequence for ayat and sentence chunks.',
    feature: 'quran',
    mode: 'mixed',
  },
  {
    id: 'quran-mcq',
    title: 'MCQ',
    description: 'Multiple-choice checks for comprehension and grammar.',
    feature: 'quran',
    mode: 'mixed',
  },
  {
    id: 'quran-passage',
    title: 'Passage',
    description: 'Reflection and passage-level comprehension prompts.',
    feature: 'quran',
    mode: 'mixed',
  },
  {
    id: 'literature-reading',
    title: 'Reading',
    description: 'Read literature excerpts with guided understanding.',
    feature: 'literature',
    mode: 'original',
  },
  {
    id: 'literature-analysis',
    title: 'Analysis',
    description: 'Analyze literary structure, themes, and rhetoric.',
    feature: 'literature',
    mode: 'mixed',
  },
];
