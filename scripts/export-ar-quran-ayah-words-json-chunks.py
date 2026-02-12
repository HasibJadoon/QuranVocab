#!/usr/bin/env python3
"""Export ar_quran_ayah.words updates from ar_u_quran_ayah_words (words only)."""

from __future__ import annotations

import argparse
import json
import sqlite3
from collections import OrderedDict
from pathlib import Path
from typing import Iterator, List, Tuple


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
    "lemma",
    "root",
]


def escape_sql(value: str) -> str:
    # SQLite string literals don't treat backslash as an escape by default.
    # Only escape single quotes to keep JSON escapes intact.
    return value.replace("'", "''")


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


def generate_updates(cursor: sqlite3.Cursor) -> Iterator[str]:
    query = """
        SELECT
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
          root
        FROM ar_u_quran_ayah_words
        ORDER BY surah, ayah, position, word_id
    """
    current_key: Tuple[int, int] | None = None
    items: List[OrderedDict[str, object]] = []

    for row in cursor.execute(query):
        word_id, surah, ayah = row[0], row[1], row[2]
        if current_key is None:
            current_key = (surah, ayah)
        elif current_key != (surah, ayah):
            payload = json.dumps(items, ensure_ascii=False, separators=(",", ":"))
            escaped = escape_sql(payload)
            yield (
                "UPDATE ar_quran_ayah SET words = '{payload}' "
                "WHERE surah = {surah} AND ayah = {ayah};\n".format(
                    payload=escaped, surah=current_key[0], ayah=current_key[1]
                )
            )
            items = []
            current_key = (surah, ayah)

        item = OrderedDict(
            (
                ("id", word_id),
                ("aya", ayah),
                ("sura", surah),
                ("position", row[3]),
                ("verse_key", row[4]),
                ("text", row[5]),
                ("simple", row[6]),
                ("juz", row[7]),
                ("hezb", row[8]),
                ("rub", row[9]),
                ("page", row[10]),
                ("class_name", row[11]),
                ("line", row[12]),
                ("code", row[13]),
                ("code_v3", row[14]),
                ("char_type", row[15]),
                ("audio", row[16]),
                ("translation", row[17]),
                ("lemma", row[18]),
                ("root", row[19]),
            )
        )
        items.append(item)

    if current_key is not None:
        payload = json.dumps(items, ensure_ascii=False, separators=(",", ":"))
        escaped = escape_sql(payload)
        yield (
            "UPDATE ar_quran_ayah SET words = '{payload}' "
            "WHERE surah = {surah} AND ayah = {ayah};\n".format(
                payload=escaped, surah=current_key[0], ayah=current_key[1]
            )
        )


def write_chunk(out_dir: Path, chunk_index: int, chunk: List[str]) -> Path:
    path = out_dir / f"ar-quran-ayah-words-{chunk_index:03}.sql"
    with path.open("w", encoding="utf-8") as fh:
        for stmt in chunk:
            fh.write(stmt)
    return path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export ar_quran_ayah.words updates.")
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Local D1 SQLite database containing ar_u_quran_ayah_words.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=100,
        help="Number of UPDATE statements per chunk file.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("ar-quran-ayah-words-chunks"),
        help="Directory where chunk files will be written.",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Delete existing chunk files before writing new ones.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Local D1 missing: {args.target_db}")
    args.out_dir.mkdir(exist_ok=True, parents=True)
    if args.cleanup:
        for existing in sorted(args.out_dir.glob("ar-quran-ayah-words-*.sql")):
            existing.unlink()

    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    updates = generate_updates(cursor)
    written = 0
    paths: List[Path] = []
    for chunk_index, chunk in chunked_iterator(updates, args.chunk_size):
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
