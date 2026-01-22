export interface QuranLessonAyahUnit {
  unit_id: string;
  unit_type: 'ayah';
  arabic: string;
  translation: string | null;
  surah: number;
  ayah: number;
  notes: string | null;
}

export interface QuranLessonText {
  arabic_full: QuranLessonAyahUnit[];
  mode: 'original' | 'edited' | 'mixed';
}

export interface QuranLessonSentence {
  sentence_id: string;
  unit_id: string;
  arabic: string;
  translation: string | null;
  notes: string | null;
}

export interface QuranLessonComprehension {
  reflective?: Array<{ question_id: string; question: string; question_ar?: string; quranic_ref?: string }>;
  analytical?: Array<{ question_id: string; question: string; question_ar?: string; quranic_ref?: string }>;
  mcqs?: Array<{ mcq_id: string; question: string; options: Array<{ option: string; is_correct: boolean }> }>;
}

export interface QuranLesson {
  id: string;
  title: string;
  title_ar?: string;
  status?: string;
  difficulty?: number;
  lesson_type: 'quran';
  text: QuranLessonText;
  sentences: QuranLessonSentence[];
  comprehension?: QuranLessonComprehension;
  reference?: {
    surah?: number;
    ayah_from?: number;
    ayah_to?: number;
    ref_label?: string;
  };
}
