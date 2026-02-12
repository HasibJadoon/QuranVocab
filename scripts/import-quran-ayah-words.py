#!/usr/bin/env python3
"""Populate ar_u_quran_ayah_words and fix lemma/root using legacy word databases."""

from __future__ import annotations

import argparse
import re
import sqlite3
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from quran_words import _normalize_simple_spelling, _parse_word_row


COLUMNS = [
    "id",
    "aya",
    "sura",
    "position",
    "verse_key",
    "text",
    "simple",
    "juz",
    "hezb",
    "rub",
    "page",
    "class_name",
    "line",
    "code",
    "code_v3",
    "char_type",
    "audio",
    "translation",
]

INT_COLUMNS = {
    "id",
    "aya",
    "sura",
    "position",
    "juz",
    "hezb",
    "rub",
    "page",
    "line",
}


def parse_word_location(location: str) -> Optional[Tuple[int, int, int]]:
    """Parse word_location strings like 54:26:4 or DOC_QURAN_HAFS:12:23:TOK_05."""
    if not location:
        return None
    parts = location.split(":")
    if len(parts) < 3:
        return None
    try:
        surah = int(parts[-3])
        ayah = int(parts[-2])
    except ValueError:
        return None
    token_part = parts[-1]
    if token_part.upper().startswith("TOK_"):
        try:
            token_index = int(token_part.split("_")[-1])
        except ValueError:
            return None
    else:
        try:
            token_index = int(token_part)
        except ValueError:
            return None
    return surah, ayah, token_index


def coerce_value(column: str, raw: Optional[str]) -> Optional[object]:
    if raw is None:
        return None
    value = raw.strip()
    if not value or value.upper() == "NULL":
        return None
    if column in INT_COLUMNS:
        try:
            return int(value)
        except ValueError:
            return None
    return value


def normalize_root(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return re.sub(r"\s+", "", value.strip()) or None


def ensure_table(cursor: sqlite3.Cursor) -> None:
    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS ar_u_quran_ayah_words (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id      INTEGER,
          surah        INTEGER NOT NULL,
          ayah         INTEGER NOT NULL,
          position     INTEGER NOT NULL,
          verse_key    TEXT,
          text         TEXT,
          simple       TEXT,
          juz          INTEGER,
          hezb         INTEGER,
          rub          INTEGER,
          page         INTEGER,
          class_name   TEXT,
          line         INTEGER,
          code         TEXT,
          code_v3      TEXT,
          char_type    TEXT,
          audio        TEXT,
          translation  TEXT,
          lemma        TEXT,
          root         TEXT,
          ar_u_root    TEXT,
          meta_json    JSON CHECK (meta_json IS NULL OR json_valid(meta_json)),
          created_at   TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at   TEXT,
          UNIQUE (surah, ayah, position, word_id),
          FOREIGN KEY (surah, ayah) REFERENCES ar_quran_ayah(surah, ayah) ON DELETE CASCADE,
          FOREIGN KEY (ar_u_root) REFERENCES ar_u_roots(ar_u_root) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ar_u_quran_ayah_words_ref
          ON ar_u_quran_ayah_words(surah, ayah, position);
        CREATE INDEX IF NOT EXISTS idx_ar_u_quran_ayah_words_root
          ON ar_u_quran_ayah_words(ar_u_root);
        """
    )


def load_lemma_map(path: Path) -> Dict[Tuple[int, int, int], str]:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    lemmas = {
        row["id"]: row
        for row in conn.execute("SELECT id, text, text_clean FROM lemmas")
    }
    mapping: Dict[Tuple[int, int, int], str] = {}
    for row in conn.execute("SELECT lemma_id, word_location FROM lemma_words"):
        key = parse_word_location(row["word_location"])
        if not key or key in mapping:
            continue
        lemma_row = lemmas.get(row["lemma_id"])
        if not lemma_row:
            continue
        lemma_text = lemma_row["text_clean"] or lemma_row["text"]
        if lemma_text:
            mapping[key] = lemma_text
    conn.close()
    return mapping


def load_root_map(path: Path) -> Dict[Tuple[int, int, int], Tuple[Optional[str], Optional[str]]]:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    roots = {
        row["id"]: row
        for row in conn.execute("SELECT id, arabic_trilateral, english_trilateral FROM roots")
    }
    mapping: Dict[Tuple[int, int, int], Tuple[Optional[str], Optional[str]]] = {}
    for row in conn.execute("SELECT root_id, word_location FROM root_words"):
        key = parse_word_location(row["word_location"])
        if not key or key in mapping:
            continue
        root_row = roots.get(row["root_id"])
        if not root_row:
            continue
        root_text = normalize_root(root_row["arabic_trilateral"])
        root_norm = (root_row["english_trilateral"] or "").strip() or None
        if root_text or root_norm:
            mapping[key] = (root_text, root_norm)
    conn.close()
    return mapping


def build_root_lookup(
    cursor: sqlite3.Cursor,
) -> Tuple[Dict[str, str], Dict[str, str]]:
    lookup: Dict[str, str] = {}
    root_value_by_id: Dict[str, str] = {}
    for row in cursor.execute(
        "SELECT ar_u_root, root, root_norm, root_latn, arabic_trilateral FROM ar_u_roots"
    ):
        ar_u_root, root, root_norm, root_latn, arabic_trilateral = row
        if ar_u_root and root:
            root_value_by_id[ar_u_root] = root
        candidates = [
            root,
            root_norm,
            root_latn,
            (root_latn or "").replace("-", "") if root_latn else None,
            arabic_trilateral,
            normalize_root(arabic_trilateral) if arabic_trilateral else None,
            root.lower() if root else None,
            root_norm.lower() if root_norm else None,
            root_latn.lower() if root_latn else None,
            (root_latn or "").replace("-", "").lower() if root_latn else None,
        ]
        for candidate in candidates:
            if candidate and candidate not in lookup:
                lookup[candidate] = ar_u_root
    return lookup, root_value_by_id


def iter_word_rows(path: Path) -> Iterable[Dict[str, object]]:
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            columns = _parse_word_row(line)
            if not columns or len(columns) < len(COLUMNS):
                continue
            row: Dict[str, object] = {}
            for idx, name in enumerate(COLUMNS):
                raw_value = columns[idx] if idx < len(columns) else None
                row[name] = coerce_value(name, raw_value)
            simple = row.get("simple")
            if isinstance(simple, str):
                row["simple"] = _normalize_simple_spelling(simple)
            yield row


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed ar_u_quran_ayah_words and fix lemma/root."
    )
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Target SQLite database.",
    )
    parser.add_argument(
        "--words-sql",
        type=Path,
        default=Path("database/salamquran_quran_words.sql"),
        help="Path to salamquran_quran_words.sql",
    )
    parser.add_argument(
        "--lemma-db",
        type=Path,
        default=Path("database/data/word-lemma.db"),
        help="Path to word-lemma.db",
    )
    parser.add_argument(
        "--root-db",
        type=Path,
        default=Path("database/data/word-root.db"),
        help="Path to word-root.db",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Missing target DB: {args.target_db}")
    if not args.words_sql.exists():
        raise SystemExit(f"Missing words SQL: {args.words_sql}")
    if not args.lemma_db.exists():
        raise SystemExit(f"Missing lemma DB: {args.lemma_db}")
    if not args.root_db.exists():
        raise SystemExit(f"Missing root DB: {args.root_db}")

    lemma_map = load_lemma_map(args.lemma_db)
    root_map = load_root_map(args.root_db)

    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    ensure_table(cursor)
    cursor.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='ar_quran_ayah';"
    )
    has_ayah_table = cursor.fetchone()[0] == 1
    ayah_count = 0
    if has_ayah_table:
        ayah_count = cursor.execute("SELECT COUNT(*) FROM ar_quran_ayah;").fetchone()[0]
    if has_ayah_table and ayah_count == 0:
        cursor.execute("PRAGMA foreign_keys = OFF;")
    else:
        cursor.execute("PRAGMA foreign_keys = ON;")
    root_lookup, root_value_by_id = build_root_lookup(cursor)

    insert_sql = """
        INSERT INTO ar_u_quran_ayah_words (
            word_id,
            surah,
            ayah,
            position,
            verse_key,
            text,
            simple,
            juz,
            hezb,
            rub,
            page,
            class_name,
            line,
            code,
            code_v3,
            char_type,
            audio,
            translation,
            lemma,
            root,
            ar_u_root,
            meta_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(surah, ayah, position, word_id) DO UPDATE SET
            verse_key = excluded.verse_key,
            text = excluded.text,
            simple = excluded.simple,
            juz = excluded.juz,
            hezb = excluded.hezb,
            rub = excluded.rub,
            page = excluded.page,
            class_name = excluded.class_name,
            line = excluded.line,
            code = excluded.code,
            code_v3 = excluded.code_v3,
            char_type = excluded.char_type,
            audio = excluded.audio,
            translation = excluded.translation,
            lemma = excluded.lemma,
            root = excluded.root,
            ar_u_root = excluded.ar_u_root,
            meta_json = excluded.meta_json,
            updated_at = datetime('now');
    """

    total_rows = 0
    fixed_lemmas = 0
    fixed_roots = 0
    matched_ar_u_roots = 0
    current_key: Optional[Tuple[int, int]] = None
    word_index = 0
    for row in iter_word_rows(args.words_sql):
        surah = row.get("sura")
        ayah = row.get("aya")
        position = row.get("position")
        char_type = row.get("char_type")
        if not isinstance(surah, int) or not isinstance(ayah, int) or not isinstance(position, int):
            continue
        if char_type != "word":
            continue
        if current_key != (surah, ayah):
            current_key = (surah, ayah)
            word_index = 0
        word_index += 1
        key = (surah, ayah, word_index)
        lemma = lemma_map.get(key)
        root_text = None
        root_norm = None
        if key in root_map:
            root_text, root_norm = root_map[key]
        ar_u_root = None
        if root_text:
            ar_u_root = root_lookup.get(root_text) or root_lookup.get(root_text.lower())
        if not ar_u_root and root_norm:
            ar_u_root = root_lookup.get(root_norm) or root_lookup.get(root_norm.lower())
        if ar_u_root and ar_u_root in root_value_by_id:
            root_text = root_value_by_id[ar_u_root]

        if lemma:
            fixed_lemmas += 1
        if root_text:
            fixed_roots += 1
        if ar_u_root:
            matched_ar_u_roots += 1

        payload = (
            row.get("id"),
            surah,
            ayah,
            word_index,
            row.get("verse_key"),
            row.get("text"),
            row.get("simple"),
            row.get("juz"),
            row.get("hezb"),
            row.get("rub"),
            row.get("page"),
            row.get("class_name"),
            row.get("line"),
            row.get("code"),
            row.get("code_v3"),
            row.get("char_type"),
            row.get("audio"),
            row.get("translation"),
            lemma,
            root_text,
            ar_u_root,
            None,
        )
        if not args.dry_run:
            cursor.execute(insert_sql, payload)
        total_rows += 1

    if args.dry_run:
        conn.rollback()
        print(
            "[dry-run] parsed {} rows; lemma={} root={} ar_u_root={}".format(
                total_rows, fixed_lemmas, fixed_roots, matched_ar_u_roots
            )
        )
    else:
        conn.commit()
        print(
            "Seeded {} rows; lemma={} root={} ar_u_root={}".format(
                total_rows, fixed_lemmas, fixed_roots, matched_ar_u_roots
            )
        )

    conn.close()


if __name__ == "__main__":
    main()
