ALTER TABLE ar_quran_ayah
ADD COLUMN words JSON CHECK (words IS NULL OR json_valid(words));
