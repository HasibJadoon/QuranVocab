PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ar_docs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  body_md     TEXT NOT NULL,
  body_json   JSON,
  tags_json   JSON,
  status      TEXT NOT NULL DEFAULT 'published',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  parent_slug TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wiki_docs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  body_md     TEXT NOT NULL,
  body_json   JSON,
  tags_json   JSON,
  status      TEXT NOT NULL DEFAULT 'published',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  parent_slug TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ar_doc_surah_link (
  doc_id   INTEGER NOT NULL,
  surah    INTEGER NOT NULL,
  note     TEXT,

  PRIMARY KEY (doc_id, surah),
  FOREIGN KEY (doc_id) REFERENCES ar_docs(id) ON DELETE CASCADE,
  FOREIGN KEY (surah)  REFERENCES ar_surahs(surah) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ar_lesson_surah_link (
  lesson_id INTEGER NOT NULL,
  surah     INTEGER NOT NULL,
  note      TEXT,

  PRIMARY KEY (lesson_id, surah),
  FOREIGN KEY (lesson_id) REFERENCES ar_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (surah)     REFERENCES ar_surahs(surah) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ar_quran_text (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sura            INTEGER NOT NULL,
  aya             INTEGER NOT NULL,
  surah_ayah      INTEGER NOT NULL,
  page            INTEGER,
  juz             INTEGER,
  hizb            INTEGER,
  ruku            INTEGER,
  surah_name      TEXT,
  surah_short_text TEXT,
  surah_name_en   TEXT,
  surah_verse     TEXT,
  verse_mark      TEXT,
  verse_full      TEXT,

  text            TEXT NOT NULL,
  text_simple     TEXT NOT NULL,
  text_normalized TEXT NOT NULL,
  text_diacritics TEXT,
  text_non_diacritics TEXT,

  first_word      TEXT,
  last_word       TEXT,
  word_count      INTEGER,
  char_count      INTEGER,

  UNIQUE (surah_ayah),
  UNIQUE (sura, aya)
);

CREATE TABLE IF NOT EXISTS ar_surah_aya (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  surah           INTEGER NOT NULL,
  aya             INTEGER NOT NULL,
  surah_ayah      INTEGER NOT NULL UNIQUE,
  theme           TEXT,
  keywords        TEXT,
  theme_json      JSON CHECK (theme_json IS NULL OR json_valid(theme_json)),
  matching_json   JSON CHECK (matching_json IS NULL OR json_valid(matching_json)),
  extra_json      JSON CHECK (extra_json IS NULL OR json_valid(extra_json)),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT,
  FOREIGN KEY (surah_ayah) REFERENCES ar_quran_text(surah_ayah) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_quran_text_surah_ayah ON ar_quran_text(sura, aya);
CREATE INDEX IF NOT EXISTS idx_ar_quran_text_page ON ar_quran_text(page);
CREATE INDEX IF NOT EXISTS idx_ar_quran_text_juz ON ar_quran_text(juz);
CREATE INDEX IF NOT EXISTS idx_ar_quran_text_hizb ON ar_quran_text(hizb);
CREATE INDEX IF NOT EXISTS idx_ar_quran_text_ruku ON ar_quran_text(ruku);
CREATE INDEX IF NOT EXISTS idx_ar_surah_aya_surah_aya ON ar_surah_aya(surah, aya);
CREATE INDEX IF NOT EXISTS idx_ar_surah_aya_surah_ayah ON ar_surah_aya(surah_ayah);

CREATE INDEX IF NOT EXISTS idx_ar_docs_slug   ON ar_docs(slug);
CREATE INDEX IF NOT EXISTS idx_ar_docs_status ON ar_docs(status);
CREATE INDEX IF NOT EXISTS idx_ar_docs_parent ON ar_docs(parent_slug);
CREATE INDEX IF NOT EXISTS idx_ar_docs_sort   ON ar_docs(sort_order);

CREATE INDEX IF NOT EXISTS idx_wiki_docs_slug   ON wiki_docs(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_status ON wiki_docs(status);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_parent ON wiki_docs(parent_slug);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_sort   ON wiki_docs(sort_order);
