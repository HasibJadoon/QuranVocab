import { LessonSection } from '../models/arabic/lesson-section.model';

export const SECTION_DATA: LessonSection[] = [
  {
    id: 'reading',
    title: 'Reading Passage',
    description: 'Original Arabic text with verse-by-verse navigation.',
    mode: 'original',
    feature: 'quran'
  },
  {
    id: 'sentences',
    title: 'Sentence Drill',
    description: 'Sentence decomposition with translations and notes.',
    mode: 'mixed',
    feature: 'quran'
  },
  {
    id: 'comprehension',
    title: 'Comprehension Practice',
    description: 'Reflective + analytical questions for the passage.',
    mode: 'mixed',
    feature: 'quran'
  },
  {
    id: 'mcq',
    title: 'MCQ Drill',
    description: 'Multiple choice questions to reinforce vocabulary.',
    mode: 'edited',
    feature: 'quran'
  },
  {
    id: 'literature-coming-soon',
    title: 'Sections Coming Soon',
    description: 'We are rolling out literature sections soon.',
    feature: 'literature'
  }
];
