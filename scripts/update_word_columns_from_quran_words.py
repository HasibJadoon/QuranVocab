from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

from quran_words import load_salam_word_map


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill quran_ayah_lemma_location word columns using the Salam Quran words dump."
    )
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Path to the D1 SQLite database that contains the quran tables.",
    )
    parser.add_argument(
        "--quran-words",
        type=Path,
        default=Path("database/data/tarteel.ai/quran-meta/salamquran_quran_words.sql"),
        help="Path to the Salam Quran words SQL dump that provides the surface forms.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not persist changes.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Target DB missing: {args.target_db}")
    word_map = load_salam_word_map(args.quran_words)

    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    updated_positions = 0
    updated_rows = 0
    total = len(word_map)

    for idx, ((surah, ayah, position), (simple, diacritic)) in enumerate(word_map.items(), start=1):
        if simple is None and diacritic is None:
            continue
        cursor.execute(
            """
            UPDATE quran_ayah_lemma_location
            SET word_simple = ?, word_diacritic = ?
            WHERE surah = ? AND ayah = ? AND token_index = ?
            """,
            (simple, diacritic, surah, ayah, position),
        )
        if cursor.rowcount:
            updated_positions += 1
            updated_rows += cursor.rowcount
        if idx % 5000 == 0:
            print(f"Processed {idx}/{total} words (positions updated: {updated_positions}).")

    if args.dry_run:
        conn.rollback()
        print("Dry-run: changes rolled back.")
    else:
        conn.commit()

    conn.close()
    print(
        f"Finished updating {updated_positions} quran word positions and {updated_rows} lemma rows "
        f"using {total} entries from the Salam dump."
    )


if __name__ == "__main__":
    main()
