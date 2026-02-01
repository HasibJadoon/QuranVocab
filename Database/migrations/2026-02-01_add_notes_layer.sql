-- Canonical notes / sources layer

PRAGMA foreign_keys = ON;

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

-- Example source + note + target
INSERT INTO ar_sources (source_type, title, author, year, publisher, notes)
VALUES ('article', 'QDS Biblical Intertext', 'Researcher', 2025, 'in-house', 'Linked q-d-s with Biblical parallels');

INSERT INTO ar_notes (user_id, note_type, title, excerpt, commentary, source_id, locator, extra_json)
VALUES (1, 'academic', 'q-d-s intertext', 'QDS is tied to Biblical intertext rather than native Arabian ritual holiness.', 'Contrast with h-r-m usage.', 1, 'doc:qds-2025#section2', '{"points":["Biblical intertext priority","Contrasts with h-r-m"],"tags":["holiness","intertext"],"confidence":0.75}');

INSERT INTO ar_note_targets (note_id, target_type, target_id, relation, share_scope, edge_note, ref, extra_json)
VALUES (1, 'u_root', 'root|qds', 'contrasts', 'public', 'Links q-d-s note to the canonical root entry', 'Q 1:1', '{"display":{"pin":true,"color":"amber"},"rank":1}');
