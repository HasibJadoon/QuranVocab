PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS ar_u_lexicon;

CREATE TABLE ar_u_lexicon (
  ar_u_lexicon        TEXT PRIMARY KEY,
  canonical_input     TEXT NOT NULL UNIQUE,

  -- Type
  unit_type           TEXT NOT NULL CHECK (unit_type IN ('word','key_term','verbal_idiom','expression')),

  -- Token surface + normalization (for single words AND also expression head/representative form)
  surface_ar          TEXT NOT NULL,
  surface_norm        TEXT NOT NULL,

  -- Core lexeme identity
  lemma_ar            TEXT,
  lemma_norm          TEXT,
  pos                 TEXT,

  -- Root linkage
  root_norm           TEXT,
  ar_u_root           TEXT,

  -- Valency / sense partitioning (kept)
  valency_id          TEXT,
  sense_key           TEXT NOT NULL,

  -- Meanings / synonyms / antonyms
  meanings_json       JSON CHECK (meanings_json IS NULL OR json_valid(meanings_json)),
  synonyms_json       JSON CHECK (synonyms_json IS NULL OR json_valid(synonyms_json)),
  antonyms_json       JSON CHECK (antonyms_json IS NULL OR json_valid(antonyms_json)),

  -- Keep your "gloss" fields as optional convenience
  gloss_primary       TEXT,
  gloss_secondary_json JSON CHECK (gloss_secondary_json IS NULL OR json_valid(gloss_secondary_json)),
  usage_notes         TEXT,

  -- Morphology
  morph_pattern       TEXT,
  morph_features_json JSON CHECK (morph_features_json IS NULL OR json_valid(morph_features_json)),
  morph_derivations_json JSON CHECK (morph_derivations_json IS NULL OR json_valid(morph_derivations_json)),

  -- Expression block (only meaningful when unit_type='expression' or 'verbal_idiom')
  expression_type     TEXT,
  expression_text     TEXT,
  expression_token_range_json JSON CHECK (expression_token_range_json IS NULL OR json_valid(expression_token_range_json)),
  expression_meaning  TEXT,

  -- References + flags
  references_json     JSON CHECK (references_json IS NULL OR json_valid(references_json)),
  flags_json          JSON CHECK (flags_json IS NULL OR json_valid(flags_json)),

  -- Existing payload buckets (kept)
  cards_json          JSON CHECK (cards_json IS NULL OR json_valid(cards_json)),
  meta_json           JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),

  status              TEXT NOT NULL DEFAULT 'active',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT,

  FOREIGN KEY (ar_u_root) REFERENCES ar_u_roots(ar_u_root) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lex_unit_type        ON ar_u_lexicon(unit_type);
CREATE INDEX IF NOT EXISTS idx_lex_lemma_norm       ON ar_u_lexicon(lemma_norm);
CREATE INDEX IF NOT EXISTS idx_lex_surface_norm     ON ar_u_lexicon(surface_norm);
CREATE INDEX IF NOT EXISTS idx_lex_root_norm        ON ar_u_lexicon(root_norm);
CREATE INDEX IF NOT EXISTS idx_lex_ar_u_root        ON ar_u_lexicon(ar_u_root);
CREATE INDEX IF NOT EXISTS idx_lex_pos              ON ar_u_lexicon(pos);
CREATE INDEX IF NOT EXISTS idx_lex_sense_key        ON ar_u_lexicon(sense_key);
CREATE INDEX IF NOT EXISTS idx_lex_valency_id       ON ar_u_lexicon(valency_id);

PRAGMA foreign_keys=ON;
