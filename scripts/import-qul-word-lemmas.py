#!/usr/bin/env python3
"""Import QUL word-lemma data into the ar_u_tokens table."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sqlite3
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


DIACRITICS_RE = re.compile(
    r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0591-\u05C7]+"
)

POS_KEYWORDS: Dict[str, List[str]] = {
    "verb": ["verb", "v", "فعل", "fi", "fiʿl"],
    "noun": ["noun", "n", "ism", "اسم"],
    "adj": ["adj", "adjective", "صفة"],
    "particle": ["particle", "p", "حرف", "prep", "conj", "gram"],
    "phrase": ["phrase", "expression", "compound"],
}


def normalize_arabic(text: Optional[str]) -> str:
    if not text:
        return ""
    normalized = text.strip()
    normalized = DIACRITICS_RE.sub("", normalized)
    normalized = " ".join(normalized.split())
    normalized = normalized.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    normalized = normalized.replace("ى", "ي").replace("ة", "ه")
    return normalized


def normalize_root_arabic(text: Optional[str]) -> str:
    if not text:
        return ""
    cleaned = DIACRITICS_RE.sub("", text)
    cleaned = "".join(cleaned.split())
    return cleaned


def canonical_pos(label: Optional[str]) -> Optional[str]:
    if not label or not label.strip():
        return None
    normalized = re.sub(r"[^A-Za-z\u0621-\u064A]+", "", label).lower()
    for canonical, keywords in POS_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized:
                return canonical
    return None


def load_pos_mapping(path: Path) -> Dict[str, str]:
    if not path.exists():
        raise FileNotFoundError(f"POS mapping file missing: {path}")
    if path.suffix.lower() == ".json":
        raw = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            return {str(k): str(v) for k, v in raw.items() if v}
        if isinstance(raw, list):
            result: Dict[str, str] = {}
            for entry in raw:
                if not isinstance(entry, dict):
                    continue
                location = entry.get("word_location") or entry.get("word")
                pos = entry.get("pos") or entry.get("part_of_speech")
                if location and pos:
                    result[str(location)] = str(pos)
            return result
        raise ValueError("JSON POS file must be dict or list of objects")

    with path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if "word_location" not in reader.fieldnames or "pos" not in reader.fieldnames:
            raise ValueError("CSV POS file must contain word_location and pos columns")
        return {row["word_location"]: row["pos"] for row in reader if row.get("pos")}


def sha256_hex(value: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return digest


def build_root_lookup(target_conn: sqlite3.Connection) -> Dict[str, str]:
    cursor = target_conn.execute("SELECT ar_u_root, root FROM ar_u_roots")
    lookup: Dict[str, str] = {}
    for row in cursor:
        root_key = normalize_root_arabic(row[1])
        if root_key:
            lookup[root_key] = row[0]
    return lookup


def choose_table(conn: sqlite3.Connection, candidates: List[str]) -> Optional[str]:
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    available = {row[0] for row in cursor}
    for candidate in candidates:
        if candidate in available:
            return candidate
    return None


def load_word_roots(root_db: Path) -> Dict[str, Optional[Dict[str, Optional[str]]]]:
    conn = sqlite3.connect(root_db)
    conn.row_factory = sqlite3.Row
    roots_by_id = {
        row["id"]: {
            "arabic_trilateral": row["arabic_trilateral"],
            "english_trilateral": row["english_trilateral"],
        }
        for row in conn.execute("SELECT id, arabic_trilateral, english_trilateral FROM roots")
    }
    word_table = choose_table(conn, ["word_roots", "root_words"])
    if not word_table:
        raise SystemExit("No word_root table found in roots SQLite file.")
    word_roots = {}
    for row in conn.execute(f"SELECT root_id, word_location FROM {word_table}"):
        root_info = roots_by_id.get(row["root_id"])
        word_roots[row["word_location"]] = root_info
    conn.close()
    return word_roots


def load_lemmas(lemmas_db: Path) -> Tuple[Dict[int, sqlite3.Row], List[Tuple[int, str]]]:
    conn = sqlite3.connect(lemmas_db)
    conn.row_factory = sqlite3.Row
    lemmas = {
        row["id"]: row for row in conn.execute("SELECT id, text, text_clean FROM lemmas")
    }
    word_table = choose_table(conn, ["word_lemmas", "lemma_words"])
    if not word_table:
        raise SystemExit("No lemma word table found in lemmas SQLite file.")
    word_rows = [(row["lemma_id"], row["word_location"]) for row in conn.execute(f"SELECT lemma_id, word_location FROM {word_table}")]
    conn.close()
    return lemmas, word_rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import QUL word lemma tokens.")
    parser.add_argument("--lemmas-db", type=Path, required=True, help="Path to the Word Lemma SQLite file")
    parser.add_argument("--roots-db", type=Path, required=True, help="Path to the Word Root SQLite file")
    parser.add_argument("--target-db", type=Path, default=Path("database/d1.db"), help="Target D1 database")
    parser.add_argument("--pos-file", type=Path, help="Optional word_location → POS mapping (CSV or JSON)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be inserted without writing")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not args.lemmas_db.exists():
        raise SystemExit(f"Word lemma database not found: {args.lemmas_db}")
    if not args.roots_db.exists():
        raise SystemExit(f"Word root database not found: {args.roots_db}")
    if not args.target_db.exists():
        raise SystemExit(f"Target database not found: {args.target_db}")

    pos_map = load_pos_mapping(args.pos_file) if args.pos_file else {}

    lemmas, word_locations = load_lemmas(args.lemmas_db)
    word_roots = load_word_roots(args.roots_db)

    target_conn = sqlite3.connect(args.target_db)
    target_conn.row_factory = sqlite3.Row
    root_lookup = build_root_lookup(target_conn)

    existing: set[Tuple[str, str]] = set()
    for row in target_conn.execute("SELECT lemma_norm, pos FROM ar_u_tokens"):
        existing.add((row["lemma_norm"], row["pos"]))

    insert_stmt = """
        INSERT INTO ar_u_tokens (
            ar_u_token, canonical_input, lemma_ar, lemma_norm, pos,
            root_norm, ar_u_root, features_json, meta_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ar_u_token) DO UPDATE SET
            canonical_input = excluded.canonical_input,
            lemma_ar = excluded.lemma_ar,
            lemma_norm = excluded.lemma_norm,
            pos = excluded.pos,
            root_norm = excluded.root_norm,
            ar_u_root = excluded.ar_u_root,
            features_json = excluded.features_json,
            meta_json = excluded.meta_json,
            updated_at = datetime('now')
    """
    cursor = target_conn.cursor()

    stats = {
        "processed": 0,
        "inserted": 0,
        "duplicates": 0,
        "missing_root": 0,
        "missing_lemma": 0,
    }

    for lemma_id, location in word_locations:
        stats["processed"] += 1
        lemma_row = lemmas.get(lemma_id)
        if not lemma_row:
            stats["missing_lemma"] += 1
            continue

        lemma_text = lemma_row["text"] or lemma_row["text_clean"] or ""
        lemma_norm = normalize_arabic(lemma_row["text_clean"] or lemma_text)
        if not lemma_norm:
            continue

        pos_label = pos_map.get(location)
        canonical_pos_value = canonical_pos(pos_label) or "noun"
        canonical_input = f"{lemma_norm}|{canonical_pos_value}"
        key = (lemma_norm, canonical_pos_value)
        if key in existing:
            stats["duplicates"] += 1
            continue

        root_info = word_roots.get(location)
        root_norm = None
        ar_u_root_id = None
        if root_info:
            normalized_root = normalize_root_arabic(root_info.get("arabic_trilateral"))
            ar_u_root_id = root_lookup.get(normalized_root)
            english = (root_info.get("english_trilateral") or "").replace(" ", "")
            parts = [p for p in [english, normalized_root] if p]
            if parts:
                root_norm = "|".join(parts)
        else:
            stats["missing_root"] += 1

        meta: Dict[str, str] = {"source": "qul_word_lemma"}
        if pos_label:
            meta["pos_label"] = pos_label
        if location:
            meta["word_location"] = location

        canonical_hash = sha256_hex(canonical_input)
        params = (
            canonical_hash,
            canonical_input,
            lemma_text,
            lemma_norm,
            canonical_pos_value,
            root_norm,
            ar_u_root_id,
            None,
            json.dumps(meta, ensure_ascii=False),
        )

        if args.dry_run:
            print("DRY", params)
        else:
            cursor.execute(insert_stmt, params)
        existing.add(key)
        stats["inserted"] += 1

    if not args.dry_run:
        target_conn.commit()

    target_conn.close()

    print("QUL lemma import summary:")
    print(f"  processed   {stats['processed']}")
    print(f"  inserted    {stats['inserted']}")
    print(f"  duplicates  {stats['duplicates']}")
    print(f"  missing root {stats['missing_root']}")
    print(f"  missing lemma {stats['missing_lemma']}")

    if args.dry_run:
        print("Dry run mode: no database changes were committed.")


if __name__ == "__main__":
    main()
