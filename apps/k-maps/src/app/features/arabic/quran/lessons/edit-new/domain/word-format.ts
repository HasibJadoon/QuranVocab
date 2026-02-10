import { QuranAyahWord } from '../../../../../../shared/models/arabic/quran-data.model';

export function formatWordLabel(word: QuranAyahWord | null | undefined): string {
  if (!word) return '';
  if (typeof word === 'string') return word;
  if (word.char_type && word.char_type !== 'word') return '';
  return (
    word.text ||
    word.word_diacritic ||
    word.word_simple ||
    word.simple ||
    word.text_uthmani ||
    ''
  );
}

export function formatWordTitle(word: QuranAyahWord | null | undefined): string {
  if (!word || typeof word === 'string') return '';
  const parts: string[] = [];
  if (word.lemma) parts.push(`Lemma: ${word.lemma}`);
  if (word.root) parts.push(`Root: ${word.root}`);
  return parts.join(' • ');
}
