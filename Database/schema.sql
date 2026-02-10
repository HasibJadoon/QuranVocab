--------------------------------------------------------------------------------
-- CLEAN 3-LAYER schema.sql (FINAL)
-- Prefix rules:
--   Arabic:    ar_
--   Worldview: wv_
--   Planner:   sp_
--   Universal: ar_u_*
--
-- NOTE (critical): SQLite/D1 cannot compute SHA-256 in SQL.
-- Compute ALL universal IDs in app/worker:
--   id = lower(hex(sha256_utf8(canonical_input)))
--
-- Universal PK columns are TEXT(64 hex). canonical_input is UNIQUE.
--------------------------------------------------------------------------------

PRAGMA foreign_keys = ON;


--------------------------------------------------------------------------------
-- 0) USERS / CORE
--------------------------------------------------------------------------------
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS user_state;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin', -- admin | editor | user

  settings_json JSON,
  last_seen_at  TEXT,

  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE user_state (
  user_id         INTEGER PRIMARY KEY,

  current_type    TEXT,        -- ar_lesson | wv_claim | wv_content_item | wv_brainstorm | wv_library_entry
  current_id      TEXT,
  current_unit_id TEXT,

  focus_mode      TEXT,        -- reading | extracting | memorizing | writing | reviewing
  state_json      JSON,

  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,

  event_type  TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,

  ref         TEXT,
  note        TEXT,
  event_json  JSON,

  created_at  TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- 1) CONTAINER LAYER (Arabic sources + registry)
--------------------------------------------------------------------------------
CREATE TABLE ar_quran_surahs (
  surah        INTEGER PRIMARY KEY,
  name_ar      TEXT NOT NULL,
  name_en      TEXT,
  ayah_count   INTEGER,
  meta_json    JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_ar_quran_surahs_name_ar ON ar_quran_surahs(name_ar);

CREATE TABLE ar_containers (
  id             TEXT PRIMARY KEY,
  container_type TEXT NOT NULL,
  container_key  TEXT NOT NULL,
  title          TEXT,
  meta_json      JSON,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,
  UNIQUE(container_type, container_key)
);

CREATE TABLE ar_container_units (
  id             TEXT PRIMARY KEY,
  container_id   TEXT NOT NULL,
  unit_type      TEXT NOT NULL,
  order_index    INTEGER NOT NULL DEFAULT 0,
  ayah_from      INTEGER,
  ayah_to        INTEGER,
  start_ref      TEXT,
  end_ref        TEXT,
  text_cache     TEXT,
  meta_json      JSON,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,
  FOREIGN KEY (container_id) REFERENCES ar_containers(id) ON DELETE CASCADE
);

CREATE TABLE ar_quran_ayah (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  surah             INTEGER NOT NULL,
  ayah              INTEGER NOT NULL,
  surah_ayah        INTEGER NOT NULL UNIQUE,
  page              INTEGER,
  juz               INTEGER,
  hizb              INTEGER,
  ruku              INTEGER,
  surah_name_ar     TEXT,
  surah_name_en     TEXT,
  text              TEXT NOT NULL,
  text_simple       TEXT NOT NULL,
  text_normalized   TEXT NOT NULL,
  text_diacritics   TEXT,
  text_non_diacritics TEXT,
  text_no_diacritics TEXT,
  first_word        TEXT,
  last_word         TEXT,
  word_count        INTEGER,
  char_count        INTEGER,
  verse_mark        TEXT,
  verse_full        TEXT,
  words             JSON CHECK (words IS NULL OR json_valid(words)),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT,
  FOREIGN KEY (surah) REFERENCES ar_quran_surahs(surah) ON DELETE RESTRICT,
  UNIQUE (surah, ayah)
);

CREATE INDEX IF NOT EXISTS idx_ar_quran_ayah_surah_ayah ON ar_quran_ayah(surah, ayah);
CREATE INDEX IF NOT EXISTS idx_ar_quran_ayah_page ON ar_quran_ayah(page);
CREATE INDEX IF NOT EXISTS idx_ar_quran_ayah_juz ON ar_quran_ayah(juz);

CREATE TABLE ar_quran_surah_ayah_meta (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_ayah      INTEGER NOT NULL UNIQUE,
  theme           TEXT,
  keywords        TEXT,
  theme_json      JSON CHECK (theme_json IS NULL OR json_valid(theme_json)),
  matching_json   JSON CHECK (matching_json IS NULL OR json_valid(matching_json)),
  extra_json      JSON CHECK (extra_json IS NULL OR json_valid(extra_json)),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,
  FOREIGN KEY (surah_ayah) REFERENCES ar_quran_ayah(surah_ayah) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_quran_surah_ayah_meta_theme ON ar_quran_surah_ayah_meta(theme);

CREATE TABLE ar_quran_translations (
  surah              INTEGER NOT NULL,
  ayah               INTEGER NOT NULL,
  translation_haleem TEXT,
  footnotes_haleem   TEXT,
  translation_asad   TEXT,
  translation_sahih  TEXT,
  translation_usmani TEXT,
  footnotes_sahih    TEXT,
  footnotes_usmani   TEXT,
  meta_json          JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT,
  PRIMARY KEY (surah, ayah)
);

CREATE TABLE ar_quran_translation_sources (
  source_key   TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  translator   TEXT,
  language     TEXT NOT NULL DEFAULT 'en',
  publisher    TEXT,
  year         INTEGER,
  isbn         TEXT,
  edition      TEXT,
  rights       TEXT,
  source_path  TEXT,
  meta_json    JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE TABLE ar_quran_translation_passages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key    TEXT NOT NULL,
  surah         INTEGER NOT NULL,
  ayah_from     INTEGER NOT NULL,
  ayah_to       INTEGER NOT NULL,
  passage_index INTEGER NOT NULL,
  page_pdf      INTEGER,
  page_book     INTEGER,
  text          TEXT,
  meta_json     JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT,
  FOREIGN KEY (source_key) REFERENCES ar_quran_translation_sources(source_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_quran_translation_passages_range
  ON ar_quran_translation_passages(source_key, surah, ayah_from, ayah_to);
CREATE INDEX IF NOT EXISTS idx_ar_quran_translation_passages_page
  ON ar_quran_translation_passages(source_key, page_book, page_pdf);

CREATE TABLE ar_lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,
  container_id TEXT,
  unit_id     TEXT,
  title       TEXT NOT NULL,
  title_ar    TEXT,
  lesson_type TEXT NOT NULL,
  subtype     TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',
  difficulty  INTEGER,
  source      TEXT,
  lesson_json JSON NOT NULL CHECK (json_valid(lesson_json)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ar_lessons_container_id ON ar_lessons(container_id);
CREATE INDEX IF NOT EXISTS idx_ar_lessons_unit_id ON ar_lessons(unit_id);

CREATE TABLE ar_lesson_unit_link (
  lesson_id     INTEGER NOT NULL,
  container_id  TEXT NOT NULL,
  unit_id       TEXT NOT NULL DEFAULT '',
  order_index   INTEGER NOT NULL DEFAULT 0,
  link_scope    TEXT NOT NULL DEFAULT 'unit',
  role          TEXT,
  note          TEXT,
  link_json     JSON CHECK (link_json IS NULL OR json_valid(link_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lesson_id, container_id, link_scope, unit_id),
  FOREIGN KEY (lesson_id)   REFERENCES ar_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (container_id) REFERENCES ar_containers(id) ON DELETE CASCADE,
  CHECK ((link_scope = 'container' AND unit_id = '') OR (link_scope = 'unit' AND unit_id != ''))
);
CREATE INDEX IF NOT EXISTS idx_ar_lesson_unit_link_lesson_order
  ON ar_lesson_unit_link(lesson_id, link_scope, unit_id);
CREATE INDEX IF NOT EXISTS idx_ar_lesson_unit_link_container
  ON ar_lesson_unit_link(container_id);

-- =====================================================================================
-- 1b) USER LESSON LAYER (empty placeholders removed earlier; add minimal tables here)
-- =====================================================================================
DROP TABLE IF EXISTS ar_lesson_enrollments;
DROP TABLE IF EXISTS ar_lesson_user_state;
DROP TABLE IF EXISTS ar_lesson_unit_progress;
DROP TABLE IF EXISTS ar_lesson_unit_tasks;

CREATE TABLE IF NOT EXISTS ar_lesson_enrollments (
  lesson_id     INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',  -- owner | editor | student
  status        TEXT NOT NULL DEFAULT 'active',   -- active | paused | completed | dropped
  settings_json JSON,
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT,
  updated_at    TEXT,
  PRIMARY KEY (lesson_id, user_id),
  FOREIGN KEY (lesson_id) REFERENCES ar_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_ar_lesson_enroll_user ON ar_lesson_enrollments(user_id, status);

CREATE TABLE IF NOT EXISTS ar_lesson_user_state (
  lesson_id        INTEGER NOT NULL,
  user_id          INTEGER NOT NULL,
  current_unit_id  TEXT,
  current_step     TEXT,
  state_json       JSON CHECK (state_json IS NULL OR json_valid(state_json)),
  progress_json    JSON CHECK (progress_json IS NULL OR json_valid(progress_json)),
  last_seen_at     TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT,
  PRIMARY KEY (lesson_id, user_id),
  FOREIGN KEY (lesson_id) REFERENCES ar_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_ar_lesson_user_state_user ON ar_lesson_user_state(user_id, last_seen_at);

CREATE TABLE IF NOT EXISTS ar_lesson_unit_progress (
  lesson_id     INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  container_id  TEXT NOT NULL,
  unit_id       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'todo',   -- todo | doing | done | skipped
  score         REAL,
  time_spent_s  INTEGER,
  attempts      INTEGER NOT NULL DEFAULT 0,
  progress_json JSON CHECK (progress_json IS NULL OR json_valid(progress_json)),
  started_at    TEXT,
  completed_at  TEXT,
  updated_at    TEXT,
  PRIMARY KEY (lesson_id, user_id, container_id, unit_id),
  FOREIGN KEY (lesson_id)    REFERENCES ar_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (container_id) REFERENCES ar_containers(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id)      REFERENCES ar_container_units(id) ON DELETE CASCADE
);
CREATE INDEX idx_ar_lesson_unit_progress_user
  ON ar_lesson_unit_progress(user_id, lesson_id, status);

CREATE TABLE IF NOT EXISTS ar_lesson_unit_tasks (
  task_id    TEXT NOT NULL,
  unit_id    TEXT NOT NULL,

  task_type  TEXT NOT NULL CHECK (task_type IN (
    'reading',
    'sentence_structure',
    'morphology',
    'grammar_concepts',
    'expressions',
    'comprehension',
    'passage_structure'
  )),

  task_name  TEXT NOT NULL,
  task_json  JSON NOT NULL CHECK (json_valid(task_json)),

  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  PRIMARY KEY (task_id),
  UNIQUE (unit_id, task_type)
);

CREATE INDEX idx_ar_lesson_unit_tasks_unit ON ar_lesson_unit_tasks(unit_id);
CREATE INDEX idx_ar_lesson_unit_tasks_type ON ar_lesson_unit_tasks(task_type);

CREATE TRIGGER IF NOT EXISTS trg_ar_lesson_unit_tasks_updated_at
AFTER UPDATE ON ar_lesson_unit_tasks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE ar_lesson_unit_tasks
  SET updated_at = datetime('now')
  WHERE task_id = OLD.task_id;
END;

--------------------------------------------------------------------------------
-- 1c) NOTES & CITATIONS (scholarly annotations)
--------------------------------------------------------------------------------
DROP TABLE IF EXISTS ar_note_targets;
DROP TABLE IF EXISTS ar_notes;
DROP TABLE IF EXISTS ar_sources;

CREATE TABLE ar_sources (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type   TEXT NOT NULL,
  title         TEXT NOT NULL,
  author        TEXT,
  year          INTEGER,
  publisher     TEXT,
  url           TEXT,
  identifier    TEXT,
  notes         TEXT,
  meta_json     JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE INDEX idx_ar_sources_type ON ar_sources(source_type);
CREATE INDEX idx_ar_sources_title ON ar_sources(title);

CREATE TABLE ar_notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER,
  note_type     TEXT NOT NULL,
  title         TEXT,
  excerpt       TEXT NOT NULL,
  commentary    TEXT,
  source_id     INTEGER,
  locator       TEXT,
  extra_json    JSON CHECK (extra_json IS NULL OR json_valid(extra_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (source_id) REFERENCES ar_sources(id) ON DELETE SET NULL
);

CREATE INDEX idx_ar_notes_type ON ar_notes(note_type);
CREATE INDEX idx_ar_notes_source ON ar_notes(source_id);

CREATE TABLE ar_note_targets (
  note_id       INTEGER NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  relation      TEXT NOT NULL DEFAULT 'about',
  strength      REAL,
  share_scope   TEXT NOT NULL DEFAULT 'private',
  edge_note     TEXT,
  container_id  TEXT,
  unit_id       TEXT,
  ref           TEXT,
  extra_json    JSON CHECK (extra_json IS NULL OR json_valid(extra_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (note_id, target_type, target_id),
  FOREIGN KEY (note_id) REFERENCES ar_notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_ar_note_targets_target ON ar_note_targets(target_type, target_id);
CREATE INDEX idx_ar_note_targets_relation ON ar_note_targets(relation);
CREATE INDEX idx_ar_note_targets_share ON ar_note_targets(share_scope);
CREATE INDEX idx_ar_note_targets_container ON ar_note_targets(container_id, unit_id);

-- =====================================================================================
-- 2) SRS LAYER (per-user spaced repetition)
-- =====================================================================================
DROP TABLE IF EXISTS ar_srs;
DROP TABLE IF EXISTS ar_srs_reviews;
DROP TABLE IF EXISTS ar_srs_state;
DROP TABLE IF EXISTS ar_srs_items;

CREATE TABLE IF NOT EXISTS ar_srs (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER NOT NULL,
  lesson_id       INTEGER,

  item_type       TEXT NOT NULL,   -- verb | noun | idiom | verb_prep | stanza | etc
  item_key        TEXT NOT NULL,   -- your stable key (e.g. "Q:12:1:root:متع" etc)

  -- SINGLE CARD JSON (front+example+morph+back+tags)
  card_json       JSON NOT NULL CHECK (json_valid(card_json)),

  -- scheduler
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','archived')),

  due_at          TEXT NOT NULL,
  last_review_at  TEXT,

  interval_days   REAL NOT NULL DEFAULT 0,
  ease            REAL NOT NULL DEFAULT 2.5,
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,

  again_count     INTEGER NOT NULL DEFAULT 0,
  hard_count      INTEGER NOT NULL DEFAULT 0,
  good_count      INTEGER NOT NULL DEFAULT 0,
  easy_count      INTEGER NOT NULL DEFAULT 0,

  last_rating     TEXT CHECK (last_rating IS NULL OR last_rating IN ('again','hard','good','easy')),
  last_response_ms INTEGER,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id)  REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES ar_lessons(id) ON DELETE SET NULL,

  -- prevent duplicates within a user’s collection
  UNIQUE (user_id, item_type, item_key)
);

-- fast queues (review screen)
CREATE INDEX IF NOT EXISTS idx_ar_srs_user_due
  ON ar_srs(user_id, status, due_at);

-- quick filtering
CREATE INDEX IF NOT EXISTS idx_ar_srs_user_lesson
  ON ar_srs(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_ar_srs_type_key
  ON ar_srs(item_type, item_key);

CREATE TRIGGER IF NOT EXISTS trg_ar_srs_updated_at
AFTER UPDATE ON ar_srs
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE ar_srs
  SET updated_at = datetime('now')
  WHERE id = OLD.id;
END;

--------------------------------------------------------------------------------
-- 1d) DOCUMENTATION TABLES (Markdown knowledge)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wiki_docs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  body_md     TEXT NOT NULL,
  body_json   JSON CHECK (body_json IS NULL OR json_valid(body_json)),
  tags_json   JSON CHECK (tags_json IS NULL OR json_valid(tags_json)),
  status      TEXT NOT NULL DEFAULT 'published',
  parent_slug TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  CHECK (status IN ('draft', 'published'))
);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_status ON wiki_docs(status);

--------------------------------------------------------------------------------
-- ar_u_lexicon (UPDATED) — captures LexicalUnit (Word | KeyTerm | VerbalIdiom | Expression)
-- Keeps your canonical_input + root FK + sense_key, but expands to:
--   UnitType, Surface/Normalized, Meanings/Synonyms/Antonyms,
--   Morphology (Pattern/Features/Derivations),
--   Expression (ExpressionType/Text/TokenRange/Meaning),
--   References, Flags
--------------------------------------------------------------------------------

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

  -- Keep your “gloss” fields as optional convenience
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

--------------------------------------------------------------------------------
-- Suggested indexes (optional, but very helpful)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lex_unit_type        ON ar_u_lexicon(unit_type);
CREATE INDEX IF NOT EXISTS idx_lex_lemma_norm       ON ar_u_lexicon(lemma_norm);
CREATE INDEX IF NOT EXISTS idx_lex_surface_norm     ON ar_u_lexicon(surface_norm);
CREATE INDEX IF NOT EXISTS idx_lex_root_norm        ON ar_u_lexicon(root_norm);
CREATE INDEX IF NOT EXISTS idx_lex_ar_u_root        ON ar_u_lexicon(ar_u_root);
CREATE INDEX IF NOT EXISTS idx_lex_pos              ON ar_u_lexicon(pos);
CREATE INDEX IF NOT EXISTS idx_lex_sense_key        ON ar_u_lexicon(sense_key);
CREATE INDEX IF NOT EXISTS idx_lex_valency_id       ON ar_u_lexicon(valency_id);

CREATE TABLE ar_grammar_units (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  unit_type   TEXT NOT NULL,
  order_index INTEGER,
  title       TEXT,
  title_ar    TEXT,
  source_id   INTEGER,
  start_page  INTEGER,
  end_page    INTEGER,
  meta_json   JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  FOREIGN KEY (parent_id) REFERENCES ar_grammar_units(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES ar_sources(id) ON DELETE SET NULL
);

CREATE TABLE ar_grammar_unit_items (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL,
  item_type   TEXT NOT NULL,
  title       TEXT,
  content     TEXT NOT NULL,
  content_ar  TEXT,
  order_index INTEGER,
  meta_json   JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  FOREIGN KEY (unit_id) REFERENCES ar_grammar_units(id) ON DELETE CASCADE
);

--------------------------------------------------------------------------------
-- 4) WORLDVIEW (wv_) + PLANNER (sp_)
-- WV knowledge tables use SHA IDs + canonical_input
--------------------------------------------------------------------------------
DROP TABLE IF EXISTS wv_quran_relations;
DROP TABLE IF EXISTS wv_discourse_edges;
DROP TABLE IF EXISTS wv_concept_sources;
DROP TABLE IF EXISTS wv_concept_anchors;
DROP TABLE IF EXISTS wv_concepts;
DROP TABLE IF EXISTS wv_cross_references;
DROP TABLE IF EXISTS wv_content_items;
DROP TABLE IF EXISTS wv_claims;
DROP TABLE IF EXISTS wv_library_entries;
DROP TABLE IF EXISTS wv_content_library_links;
DROP TABLE IF EXISTS wv_brainstorm_sessions;

DROP TABLE IF EXISTS sp_sprint_reviews;
DROP TABLE IF EXISTS sp_weekly_tasks;
DROP TABLE IF EXISTS sp_weekly_plans;

DROP TABLE IF EXISTS ar_reviews;

CREATE TABLE wv_brainstorm_sessions (
  id             TEXT PRIMARY KEY,
  user_id        INTEGER,

  topic          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',
  stage          TEXT NOT NULL DEFAULT 'raw',
  schema_version INTEGER NOT NULL DEFAULT 2,
  revision       INTEGER,

  session_json   JSON NOT NULL CHECK (json_valid(session_json)),

  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE wv_concepts (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  slug            TEXT NOT NULL UNIQUE,
  label_ar        TEXT,
  label_en        TEXT,
  category        TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);

CREATE TABLE wv_concept_anchors (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  concept_id      TEXT NOT NULL,

  target_type     TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  unit_id         TEXT,
  ref             TEXT,
  evidence        TEXT NOT NULL,
  note            TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (concept_id) REFERENCES wv_concepts(id) ON DELETE CASCADE
);

CREATE TABLE wv_concept_sources (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  concept_id      TEXT NOT NULL,

  scholar_name    TEXT NOT NULL,
  work_title      TEXT NOT NULL,
  work_type       TEXT,
  publisher       TEXT,
  year            INTEGER,

  locator         TEXT,
  lens            TEXT,
  claim_summary   TEXT NOT NULL,

  quote_short     TEXT,
  url             TEXT,
  note            TEXT,
  meta_json       JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (concept_id) REFERENCES wv_concepts(id) ON DELETE CASCADE
);

CREATE TABLE wv_claims (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  claim           JSON NOT NULL CHECK (json_valid(claim)),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE wv_content_items (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  title           TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',

  related_type    TEXT,
  related_id      TEXT,

  refs_json       JSON NOT NULL CHECK (json_valid(refs_json)),
  content_json    JSON NOT NULL CHECK (json_valid(content_json)),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE wv_cross_references (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  status          TEXT NOT NULL DEFAULT 'active',
  ref_json        JSON NOT NULL CHECK (json_valid(ref_json)),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE wv_discourse_edges (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,

  edge_type       TEXT NOT NULL,
  relation        TEXT NOT NULL,
  strength        REAL,

  from_type       TEXT NOT NULL,
  from_id         TEXT NOT NULL,
  from_unit       TEXT,

  to_type         TEXT NOT NULL,
  to_id           TEXT NOT NULL,
  to_unit         TEXT,

  note            TEXT,
  meta_json       JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE wv_quran_relations (
  id              TEXT PRIMARY KEY,
  canonical_input TEXT NOT NULL UNIQUE,

  user_id         INTEGER,
  concept_id      TEXT NOT NULL,
  target_type     TEXT NOT NULL,
  target_id       TEXT NOT NULL,

  relation        TEXT NOT NULL,
  quran_evidence_json JSON CHECK (quran_evidence_json IS NULL OR json_valid(quran_evidence_json)),
  note            TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,

  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (concept_id) REFERENCES wv_concepts(id) ON DELETE CASCADE
);

CREATE TABLE sp_weekly_plans (
  week_start    TEXT PRIMARY KEY,
  user_id       INTEGER,

  notes         TEXT,
  planned_count INTEGER NOT NULL DEFAULT 0,
  done_count    INTEGER NOT NULL DEFAULT 0,

  week_json     JSON NOT NULL CHECK (json_valid(week_json)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sp_weekly_tasks (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER,

  week_start         TEXT NOT NULL,
  title              TEXT NOT NULL,

  task_type          TEXT NOT NULL,
  kanban_state       TEXT NOT NULL DEFAULT 'backlog',
  status             TEXT NOT NULL DEFAULT 'planned',
  priority           INTEGER DEFAULT 3,
  points             REAL,
  due_date           TEXT,
  order_index        INTEGER NOT NULL DEFAULT 0,

  task_json          JSON NOT NULL CHECK (json_valid(task_json)),

  ar_lesson_id       INTEGER,
  wv_claim_id        TEXT,
  wv_content_item_id TEXT,

  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT,

  FOREIGN KEY (user_id)            REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (week_start)         REFERENCES sp_weekly_plans(week_start) ON DELETE CASCADE,
  FOREIGN KEY (ar_lesson_id)       REFERENCES ar_lessons(id) ON DELETE SET NULL
);

CREATE TABLE sp_sprint_reviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER,

  period_start TEXT NOT NULL,
  period_end   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',

  review_json  JSON NOT NULL CHECK (json_valid(review_json)),

  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE ar_reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,

  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,

  rating      INTEGER,
  note        TEXT,

  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

--------------------------------------------------------------------------------
-- INDEXES (minimal + useful)
--------------------------------------------------------------------------------
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_user_state_current     ON user_state(current_type, current_id);
CREATE INDEX idx_user_logs_user_id      ON user_activity_logs(user_id);
CREATE INDEX idx_user_logs_type         ON user_activity_logs(event_type);
CREATE INDEX idx_user_logs_target       ON user_activity_logs(target_type, target_id);
CREATE INDEX idx_user_logs_created      ON user_activity_logs(created_at);



CREATE INDEX idx_ar_lessons_user_id  ON ar_lessons(user_id);
CREATE INDEX idx_ar_lessons_status   ON ar_lessons(status);
CREATE INDEX idx_ar_lessons_type     ON ar_lessons(lesson_type);

CREATE INDEX idx_ar_containers_type_key ON ar_containers(container_type, container_key);
CREATE INDEX idx_ar_units_container_order ON ar_container_units(container_id, order_index);

CREATE INDEX idx_ar_grammar_units_parent ON ar_grammar_units(parent_id);
CREATE INDEX idx_ar_grammar_units_type ON ar_grammar_units(unit_type);
CREATE INDEX idx_ar_grammar_units_source ON ar_grammar_units(source_id);
CREATE INDEX idx_ar_grammar_unit_items_unit ON ar_grammar_unit_items(unit_id);
CREATE INDEX idx_ar_grammar_unit_items_type ON ar_grammar_unit_items(item_type);

CREATE INDEX idx_wv_brainstorm_user_id ON wv_brainstorm_sessions(user_id);
CREATE INDEX idx_wv_brainstorm_topic   ON wv_brainstorm_sessions(topic);
CREATE INDEX idx_wv_brainstorm_status  ON wv_brainstorm_sessions(status);
CREATE INDEX idx_wv_brainstorm_stage   ON wv_brainstorm_sessions(stage);

CREATE INDEX idx_wv_concepts_slug        ON wv_concepts(slug);
CREATE INDEX idx_wv_concepts_category    ON wv_concepts(category);
CREATE INDEX idx_wv_concepts_status      ON wv_concepts(status);

CREATE INDEX idx_wv_concept_anchors_concept ON wv_concept_anchors(concept_id);
CREATE INDEX idx_wv_concept_anchors_target  ON wv_concept_anchors(target_type, target_id);
CREATE INDEX idx_wv_concept_anchors_unit    ON wv_concept_anchors(unit_id);

CREATE INDEX idx_wv_concept_sources_concept ON wv_concept_sources(concept_id);
CREATE INDEX idx_wv_concept_sources_scholar ON wv_concept_sources(scholar_name);
CREATE INDEX idx_wv_concept_sources_lens    ON wv_concept_sources(lens);

CREATE INDEX idx_wv_claims_status        ON wv_claims(status);

CREATE INDEX idx_wv_content_items_type   ON wv_content_items(content_type);
CREATE INDEX idx_wv_content_items_status ON wv_content_items(status);
CREATE INDEX idx_wv_content_items_related ON wv_content_items(related_type, related_id);

CREATE INDEX idx_wv_cross_references_status ON wv_cross_references(status);

CREATE INDEX idx_wv_discourse_edges_type     ON wv_discourse_edges(edge_type);
CREATE INDEX idx_wv_discourse_edges_relation ON wv_discourse_edges(relation);
CREATE INDEX idx_wv_discourse_edges_from     ON wv_discourse_edges(from_type, from_id);
CREATE INDEX idx_wv_discourse_edges_to       ON wv_discourse_edges(to_type, to_id);

CREATE INDEX idx_wv_quran_relations_concept  ON wv_quran_relations(concept_id);
CREATE INDEX idx_wv_quran_relations_target   ON wv_quran_relations(target_type, target_id);
CREATE INDEX idx_wv_quran_relations_relation ON wv_quran_relations(relation);

CREATE INDEX idx_sp_weekly_plans_user_id        ON sp_weekly_plans(user_id);

CREATE INDEX idx_sp_weekly_tasks_user_id        ON sp_weekly_tasks(user_id);
CREATE INDEX idx_sp_weekly_tasks_week           ON sp_weekly_tasks(week_start);
CREATE INDEX idx_sp_weekly_tasks_type           ON sp_weekly_tasks(task_type);
CREATE INDEX idx_sp_weekly_tasks_kanban_state   ON sp_weekly_tasks(kanban_state);
CREATE INDEX idx_sp_weekly_tasks_status         ON sp_weekly_tasks(status);
CREATE INDEX idx_sp_weekly_tasks_order          ON sp_weekly_tasks(week_start, kanban_state, order_index);

CREATE INDEX idx_sp_sprint_reviews_user_id      ON sp_sprint_reviews(user_id);
CREATE INDEX idx_sp_sprint_reviews_period       ON sp_sprint_reviews(period_start, period_end);
CREATE INDEX idx_sp_sprint_reviews_status       ON sp_sprint_reviews(status);
