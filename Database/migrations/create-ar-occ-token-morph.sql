CREATE TABLE IF NOT EXISTS ar_occ_token_morph (
  ar_token_occ_id    TEXT PRIMARY KEY,

  pos                TEXT,

  noun_case          TEXT,
  noun_number        TEXT,
  noun_gender        TEXT,
  noun_definiteness  TEXT,

  verb_tense         TEXT,
  verb_mood          TEXT,
  verb_voice         TEXT,
  verb_person        TEXT,
  verb_number        TEXT,
  verb_gender        TEXT,

  particle_type      TEXT,

  extra_json         JSON CHECK (extra_json IS NULL OR json_valid(extra_json)),

  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT,

  FOREIGN KEY (ar_token_occ_id) REFERENCES ar_occ_token(ar_token_occ_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_occ_token_morph_pos ON ar_occ_token_morph(pos);

CREATE TABLE IF NOT EXISTS ar_u_morphology (
  ar_u_morphology  TEXT PRIMARY KEY,
  canonical_input  TEXT NOT NULL UNIQUE,

  surface_ar       TEXT NOT NULL,
  surface_norm     TEXT NOT NULL,

  -- Codes (stable, hashed)
  pos2             TEXT NOT NULL CHECK (pos2 IN ('verb','noun','prep','particle')),
  derivation_type  TEXT CHECK (derivation_type IN ('jamid','mushtaq')),
  noun_number      TEXT CHECK (noun_number IN ('singular','plural','dual')),

  derived_from_verb_form TEXT CHECK (
    derived_from_verb_form IN ('I','II','III','IV','V','VI','VII','VIII','IX','X')
  ),

  derived_pattern  TEXT CHECK (
    derived_pattern IN (
      'ism_fael','ism_mafool','masdar','sifah_mushabbahah','ism_mubalaghah',
      'ism_zaman','ism_makan','ism_ala','tafdeel','nisbah','other'
    )
  ),

  -- Arabic tags (display-only, NOT hashed)
  pos2_ar            TEXT,
  derivation_type_ar TEXT,
  derived_pattern_ar TEXT,

  -- optional extra tags for UI/search (Arabic + English)
  tags_json        JSON CHECK (tags_json IS NULL OR json_valid(tags_json)),

  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT
);
