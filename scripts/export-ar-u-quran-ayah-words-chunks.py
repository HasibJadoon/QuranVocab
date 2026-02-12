#!/usr/bin/env python3
"""Export ar_u_quran_ayah_words into chunked SQL for D1 remote updates."""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
from typing import Iterator, List, Sequence, Tuple, Union


COLUMNS: Sequence[str] = (
    "word_id",
    "surah",
    "ayah",
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
    "lemma",
    "root",
    "ar_u_root",
    "meta_json",
)


def _escape_sql_value(value: Union[str, int, float, None]) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    return "'" + text.replace("\\", "\\\\").replace("'", "''") + "'"


def chunked_iterator(iterator: Iterator[str], chunk_size: int) -> Iterator[Tuple[int, List[str]]]:
    chunk: List[str] = []
    index = 1
    for stmt in iterator:
        chunk.append(stmt)
        if len(chunk) >= chunk_size:
            yield index, chunk
            index += 1
            chunk = []
    if chunk:
        yield index, chunk


def generate_inserts(cursor: sqlite3.Cursor) -> Iterator[str]:
    select_sql = (
        "SELECT "
        + ", ".join(COLUMNS)
        + " FROM ar_u_quran_ayah_words "
        + "ORDER BY surah, ayah, position, word_id"
    )
    for row in cursor.execute(select_sql):
        values = ", ".join(_escape_sql_value(value) for value in row)
        yield (
            "INSERT INTO ar_u_quran_ayah_words ("
            + ", ".join(COLUMNS)
            + ") VALUES ("
            + values
            + ") "
            + "ON CONFLICT(surah, ayah, position, word_id) DO UPDATE SET "
            + "lemma = excluded.lemma, "
            + "root = excluded.root, "
            + "ar_u_root = excluded.ar_u_root, "
            + "updated_at = datetime('now');\n"
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export chunked ar_u_quran_ayah_words SQL.")
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Local D1 SQLite database containing ar_u_quran_ayah_words.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=250,
        help="Number of INSERT statements per chunk file.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("ar-u-quran-ayah-words-chunks"),
        help="Directory where chunk files will be written.",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Delete existing chunk files before writing new ones.",
    )
    return parser.parse_args()


def write_chunk(out_dir: Path, chunk_index: int, chunk: List[str]) -> Path:
    path = out_dir / f"ar-u-quran-ayah-words-{chunk_index:03}.sql"
    with path.open("w", encoding="utf-8") as fh:
        fh.write("PRAGMA foreign_keys=OFF;\n")
        for stmt in chunk:
            fh.write(stmt)
    return path


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Local D1 missing: {args.target_db}")
    args.out_dir.mkdir(exist_ok=True, parents=True)
    if args.cleanup:
        for existing in sorted(args.out_dir.glob("ar-u-quran-ayah-words-*.sql")):
            existing.unlink()
    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    inserts = generate_inserts(cursor)
    written = 0
    paths: List[Path] = []
    for chunk_index, chunk in chunked_iterator(inserts, args.chunk_size):
        path = write_chunk(args.out_dir, chunk_index, chunk)
        paths.append(path)
        written += len(chunk)
        print(f"Wrote chunk {chunk_index} ({len(chunk)} statements) to {path}")
    conn.close()
    if written == 0:
        print("No statements exported.")
        return
    print(
        f"Exported {written} statements across {len(paths)} chunk(s); "
        f"chunks live under {args.out_dir}."
    )


if __name__ == "__main__":
    main()
