from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
from typing import Iterator, Tuple, Union


def _escape_sql_string(value: Union[str, None]) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def generate_updates(cursor: sqlite3.Cursor) -> Iterator[str]:
    query = """
        SELECT surah, ayah, token_index, word_simple, word_diacritic
        FROM quran_ayah_lemma_location
        WHERE word_simple IS NOT NULL OR word_diacritic IS NOT NULL
        ORDER BY surah, ayah, token_index
    """
    for surah, ayah, token_index, word_simple, word_diacritic in cursor.execute(query):
        yield (
            "UPDATE quran_ayah_lemma_location\n"
            "SET word_simple = %s, word_diacritic = %s\n"
            "WHERE surah = %s AND ayah = %s AND token_index = %s;\n"
            % (
                _escape_sql_string(word_simple),
                _escape_sql_string(word_diacritic),
                surah,
                ayah,
                token_index,
            )
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Surface-word updates for remote D1.")
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Local D1 SQLite database that already contains updated surface words.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("word-updates.sql"),
        help="File path where the SQL script for the remote D1 will be written.",
    )
    parser.add_argument(
        "--transaction",
        action="store_true",
        help="Wrap the export in BEGIN/COMMIT (some targets require it). Cloudflare D1 rejects explicit transactions, so omit this flag there.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Local D1 database missing: {args.target_db}")
    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    with args.out.open("w", encoding="utf-8") as out:
        if args.transaction:
            out.write("BEGIN TRANSACTION;\n")
        for stmt in generate_updates(cursor):
            out.write(stmt)
        if args.transaction:
            out.write("COMMIT;\n")
    conn.close()
    print(f"Wrote surface-word updates to {args.out} ({args.out.stat().st_size} bytes).")


if __name__ == "__main__":
    main()
