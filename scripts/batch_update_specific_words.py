from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
from typing import Iterable, List, Sequence

from quran_words import load_salam_word_map


def chunked(iterable: Sequence, size: int) -> Iterable[Sequence]:
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def parse_targets(raw: str) -> List[str]:
    return [token.strip() for token in raw.split(",") if token.strip()]


def gather_rows(cursor: sqlite3.Cursor, targets: List[str]) -> List[sqlite3.Row]:
    placeholders = ",".join("?" for _ in targets)
    query = f"""
        SELECT id, surah, ayah, token_index, word_location, word_simple
        FROM quran_ayah_lemma_location
        WHERE word_simple IN ({placeholders})
        ORDER BY surah, ayah, token_index
    """
    cursor.row_factory = sqlite3.Row
    return list(cursor.execute(query, targets))


def build_updates(rows: List[sqlite3.Row], word_map: dict, targets: List[str]) -> List[tuple]:
    updates = []
    for row in rows:
        surah = row["surah"]
        ayah = row["ayah"]
        token_index = row["token_index"]
        key = (surah, ayah, token_index)
        simple, diacritic = word_map.get(key, (None, None))
        if simple is None and diacritic is None:
            continue
        updates.append((simple, diacritic, row["id"], row["word_location"], row["word_simple"]))
    return updates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch update specific lemma words with exact surface forms.")
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Target D1 SQLite database (should already contain lemma rows).",
    )
    parser.add_argument(
        "--words",
        type=str,
        default="عربي,عقل,انزل,ان,قرءان,لعل",
        help="Comma-separated list of lemma surface forms to refresh (defaults to the words you listed).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="How many updates to run per transaction chunk.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't commit updates; only show planned counts.",
    )
    parser.add_argument(
        "--quran-words",
        type=Path,
        default=Path("database/data/tarteel.ai/quran-meta/salamquran_quran_words.sql"),
        help="Path to the Salam SQL dump for mapping (surface forms + diacritics).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Target DB missing: {args.target_db}")
    word_map = load_salam_word_map(args.quran_words)
    targets = parse_targets(args.words)

    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    rows = gather_rows(cursor, targets)
    updates = build_updates(rows, word_map, targets)

    if not updates:
        print("No updates to run; all target rows already match the surface map.")
        return

    print(f"Prepared {len(updates)} updates for lemmas {targets}.")

    for chunk in chunked(updates, args.batch_size):
        cursor.executemany(
            "UPDATE quran_ayah_lemma_location SET word_simple = ?, word_diacritic = ? WHERE id = ?",
            [(simple, diacritic, row_id) for simple, diacritic, row_id, *_ in chunk],
        )
        if not args.dry_run:
            conn.commit()
        print(f"Applied chunk of {len(chunk)} updates (dry-run={args.dry_run}).")

    if args.dry_run:
        conn.rollback()
        print("Dry-run: rolled back all transactions.")
    else:
        print("Committed all updates.")

    conn.close()


if __name__ == "__main__":
    main()
