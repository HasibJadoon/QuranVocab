PRAGMA foreign_keys = ON;

ALTER TABLE ar_source_chunks
  ADD COLUMN chunk_type TEXT NOT NULL DEFAULT 'lexicon'
  CHECK (chunk_type IN ('grammar', 'literature', 'lexicon', 'reference', 'other'));

CREATE INDEX IF NOT EXISTS idx_chunks_source_type
  ON ar_source_chunks(ar_u_source, chunk_type);
