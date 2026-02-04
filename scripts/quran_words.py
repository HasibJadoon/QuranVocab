from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple


WordKey = Tuple[int, int, int]
WordValue = Tuple[Optional[str], Optional[str]]

# Normalize a few orthographic variants from the Salam dump to the app's
# expected "simple" spelling.
SIMPLE_SPELLING_OVERRIDES = {
    "هاذا": "هذا",
    "هاذه": "هذه",
    "هاذان": "هذان",
    "هاذين": "هذين",
    "ذالك": "ذلك",
    "لاكن": "لكن",
}


def _parse_word_row(line: str) -> Optional[List[str]]:
    """Split a single INSERT row into individual column strings."""
    row = line.strip()
    if not row or not row.startswith("("):
        return None
    row = row.rstrip(",;")
    if row.startswith("("):
        row = row[1:]
    if row.endswith(")"):
        row = row[:-1]

    columns: List[str] = []
    buffer: List[str] = []
    in_quote = False
    i = 0
    while i < len(row):
        ch = row[i]
        if in_quote:
            if ch == "\\" and i + 1 < len(row):
                buffer.append(row[i + 1])
                i += 2
                continue
            if ch == "'" and i + 1 < len(row) and row[i + 1] == "'":
                buffer.append("'")
                i += 2
                continue
            if ch == "'":
                in_quote = False
                i += 1
                continue
            buffer.append(ch)
            i += 1
            continue
        if ch == "'":
            in_quote = True
            i += 1
            continue
        if ch == ",":
            columns.append("".join(buffer).strip())
            buffer = []
            i += 1
            continue
        buffer.append(ch)
        i += 1

    if buffer:
        columns.append("".join(buffer).strip())
    return columns


def _normalize_value(value: str) -> Optional[str]:
    normalized = value.strip()
    if not normalized or normalized.upper() == "NULL":
        return None
    return normalized


def _normalize_simple_spelling(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    return SIMPLE_SPELLING_OVERRIDES.get(value, value)


def load_salam_word_map(path: Path) -> Dict[WordKey, WordValue]:
    """Load the salamquran_quran_words dataset and return (surah, ayah, position) -> (simple, text)."""
    if not path.exists():
        raise FileNotFoundError(f"Quran words dump missing: {path}")
    mapping: Dict[WordKey, WordValue] = {}
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            columns = _parse_word_row(line)
            if not columns or len(columns) < 7:
                continue
            try:
                aya = int(columns[1])
                surah = int(columns[2])
                position = int(columns[3])
            except ValueError:
                continue
            text = _normalize_value(columns[5])
            simple = _normalize_simple_spelling(_normalize_value(columns[6]))
            if text is None and simple is None:
                continue
            mapping[(surah, aya, position)] = (simple, text)
    return mapping
