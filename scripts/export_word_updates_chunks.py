from __future__ import annotations

import argparse
import math
import sqlite3
from pathlib import Path
from typing import Iterator, Tuple, Union


def _escape_sql_string(value: Union[str, None]) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def chunked_iterator(iterator: Iterator[str], chunk_size: int) -> Iterator[Tuple[int, list]]:
    chunk: list[str] = []
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
    parser = argparse.ArgumentParser(description="Export chunked surface-word SQL for remote D1.")
    parser.add_argument(
        "--target-db",
        type=Path,
        default=Path("database/d1.db"),
        help="Local D1 SQLite database containing the updated surface words.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=500,
        help="Number of UPDATE statements per chunk file.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("word-updates-chunks"),
        help="Directory where chunk files will be written.",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Delete existing chunk files before writing new ones.",
    )
    return parser.parse_args()


def write_chunk(out_dir: Path, chunk_index: int, chunk: list[str]) -> Path:
    path = out_dir / f"word-updates-{chunk_index:03}.sql"
    with path.open("w", encoding="utf-8") as fh:
        for stmt in chunk:
            fh.write(stmt)
    return path


def main() -> None:
    args = parse_args()
    if not args.target_db.exists():
        raise SystemExit(f"Local D1 missing: {args.target_db}")
    args.out_dir.mkdir(exist_ok=True, parents=True)
    if args.cleanup:
        for existing in sorted(args.out_dir.glob("word-updates-*.sql")):
            existing.unlink()
    conn = sqlite3.connect(args.target_db)
    cursor = conn.cursor()
    updates = generate_updates(cursor)
    written = 0
    paths: list[Path] = []
    for chunk_index, chunk in chunked_iterator(updates, args.chunk_size):
        path = write_chunk(args.out_dir, chunk_index, chunk)
        paths.append(path)
        written += len(chunk)
        print(f"Wrote chunk {chunk_index} ({len(chunk)} statements) to {path}")
    conn.close()
    total_chunks = len(paths)
    total_statements = written
    if total_statements == 0:
        print("No updates exported.")
        return
    print(
        f"Exported {total_statements} statements across {total_chunks} chunk(s); "
        f"chunks live under {args.out_dir}."
    )
    print("Execute the chunks sequentially with `wrangler d1 execute knowledgemap --file <chunk>.sql --remote`.")


if __name__ == "__main__":
    main()
