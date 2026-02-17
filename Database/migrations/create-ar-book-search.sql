PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- Book/source search backbone
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ar_u_sources (
  ar_u_source       TEXT PRIMARY KEY,
  canonical_input   TEXT NOT NULL UNIQUE,
  source_code       TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  author            TEXT,
  publisher         TEXT,
  publication_year  INTEGER,
  language          TEXT,
  type              TEXT NOT NULL DEFAULT 'book',
  meta_json         JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);

CREATE TABLE IF NOT EXISTS ar_source_chunks (
  chunk_id       TEXT PRIMARY KEY,
  ar_u_source    TEXT NOT NULL,
  page_no        INTEGER,
  locator        TEXT,
  heading_raw    TEXT,
  heading_norm   TEXT,
  chunk_type     TEXT NOT NULL DEFAULT 'lexicon'
                 CHECK (chunk_type IN ('grammar', 'literature', 'lexicon', 'reference', 'other')),
  text           TEXT NOT NULL,
  meta_json      JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,
  FOREIGN KEY (ar_u_source) REFERENCES ar_u_sources(ar_u_source)
);

CREATE TABLE IF NOT EXISTS ar_u_lexicon_evidence (
  ar_u_lexicon   TEXT NOT NULL,
  chunk_id       TEXT NOT NULL,
  ar_u_source    TEXT NOT NULL,
  page_no        INTEGER,
  link_role      TEXT NOT NULL DEFAULT 'mentions',
  span_start     INTEGER,
  span_end       INTEGER,
  extract_text   TEXT,
  notes          TEXT,
  meta_json      JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,
  PRIMARY KEY (ar_u_lexicon, chunk_id),
  FOREIGN KEY (ar_u_lexicon) REFERENCES ar_u_lexicon(ar_u_lexicon) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES ar_source_chunks(chunk_id) ON DELETE CASCADE,
  FOREIGN KEY (ar_u_source) REFERENCES ar_u_sources(ar_u_source)
);

CREATE INDEX IF NOT EXISTS idx_chunks_source_page
  ON ar_source_chunks(ar_u_source, page_no);

CREATE INDEX IF NOT EXISTS idx_chunks_source_heading
  ON ar_source_chunks(ar_u_source, heading_norm);

CREATE INDEX IF NOT EXISTS idx_chunks_source_type
  ON ar_source_chunks(ar_u_source, chunk_type);

CREATE INDEX IF NOT EXISTS idx_lex_ev_source_page
  ON ar_u_lexicon_evidence(ar_u_source, page_no);

CREATE INDEX IF NOT EXISTS idx_lex_ev_chunk
  ON ar_u_lexicon_evidence(chunk_id);

--------------------------------------------------------------------------------
-- FTS tables (contentful)
-- Rebuild on each migration execution to normalize earlier contentless variants.
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS ar_source_chunks_fts;
DROP TABLE IF EXISTS ar_u_lexicon_evidence_fts;

CREATE VIRTUAL TABLE ar_source_chunks_fts USING fts5(
  chunk_id UNINDEXED,
  source_code,
  heading_norm,
  text
);

CREATE VIRTUAL TABLE ar_u_lexicon_evidence_fts USING fts5(
  ar_u_lexicon UNINDEXED,
  chunk_id UNINDEXED,
  source_code,
  extract_text,
  notes
);

INSERT INTO ar_source_chunks_fts(chunk_id, source_code, heading_norm, text)
SELECT
  c.chunk_id,
  s.source_code,
  COALESCE(c.heading_norm, ''),
  c.text
FROM ar_source_chunks c
JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source;

INSERT INTO ar_u_lexicon_evidence_fts(ar_u_lexicon, chunk_id, source_code, extract_text, notes)
SELECT
  e.ar_u_lexicon,
  e.chunk_id,
  s.source_code,
  COALESCE(e.extract_text, ''),
  COALESCE(e.notes, '')
FROM ar_u_lexicon_evidence e
JOIN ar_u_sources s ON s.ar_u_source = e.ar_u_source;
