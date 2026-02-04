-- Normalize known orthographic variants in quran_ayah_lemma_location.word_simple.
-- Source issue examples:
--   12:3:9 -> "هاذا" should be "هذا"

UPDATE quran_ayah_lemma_location
SET word_simple = 'هذا'
WHERE word_simple = 'هاذا';

UPDATE quran_ayah_lemma_location
SET word_simple = 'هذه'
WHERE word_simple = 'هاذه';

UPDATE quran_ayah_lemma_location
SET word_simple = 'هذان'
WHERE word_simple = 'هاذان';

UPDATE quran_ayah_lemma_location
SET word_simple = 'هذين'
WHERE word_simple = 'هاذين';

UPDATE quran_ayah_lemma_location
SET word_simple = 'ذلك'
WHERE word_simple = 'ذالك';

UPDATE quran_ayah_lemma_location
SET word_simple = 'لكن'
WHERE word_simple = 'لاكن';
