--------------------------------------------------------------------------------
-- Add synonyms_norm_text + meanings_json to ar_quran_synonym_words
--------------------------------------------------------------------------------

ALTER TABLE ar_quran_synonym_words ADD COLUMN synonyms_norm_text TEXT;
ALTER TABLE ar_quran_synonym_words ADD COLUMN meanings_json JSON
  CHECK (meanings_json IS NULL OR json_valid(meanings_json));
