#!/usr/bin/env python3
"""
Import curated verbal-idiom notes into:
  - ar_u_sources
  - ar_source_chunks
  - ar_u_lexicon
  - ar_u_lexicon_evidence
and refresh FTS rows for the selected source_code.

Usage:
  python3 scripts/import_verbal_idioms_notes.py \
    --input resources/lexicon/surah-12-verbal-idioms.json \
    --apply --remote
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sql_quote(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def norm_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.strip().lower().split())


def as_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except Exception:
        return None
    return parsed


def page_from_item(item: dict[str, Any]) -> int | None:
    g = item.get("gloss_secondary_json")
    if isinstance(g, dict):
        page = as_int(g.get("page"))
        if page is not None:
            return page
        source_ref = g.get("source_ref")
        if isinstance(source_ref, dict):
            return as_int(source_ref.get("page"))
    return None


def quran_examples_text(g: dict[str, Any]) -> str:
    examples = g.get("quran_examples")
    if not isinstance(examples, list):
        return ""
    parts: list[str] = []
    for ex in examples:
        if not isinstance(ex, dict):
            continue
        surah = ex.get("surah")
        ayah = ex.get("ayah")
        phrase = str(ex.get("phrase") or "").strip()
        ref = ""
        if surah is not None and ayah is not None:
            ref = f"{surah}:{ayah}"
        if ref and phrase:
            parts.append(f"{ref} {phrase}")
        elif ref:
            parts.append(ref)
        elif phrase:
            parts.append(phrase)
    return "; ".join(parts)


def format_chunk_block(item: dict[str, Any], index: int) -> str:
    g = item.get("gloss_secondary_json")
    if not isinstance(g, dict):
        g = {}

    construction = str(g.get("construction") or "").strip()
    lemma_ar = str(item.get("lemma_ar") or "").strip()
    lemma_norm = str(item.get("lemma_norm") or "").strip()
    gloss = str(item.get("gloss_primary") or "").strip()
    note = str(g.get("note") or "").strip()
    quran_refs = quran_examples_text(g)

    header = construction or lemma_ar or str(item.get("sense_key") or f"item-{index}")
    lines: list[str] = [f"{index}. {header}"]
    if lemma_ar or lemma_norm:
        if lemma_ar and lemma_norm:
            lines.append(f"Lemma: {lemma_ar} ({lemma_norm})")
        elif lemma_ar:
            lines.append(f"Lemma: {lemma_ar}")
        else:
            lines.append(f"Lemma norm: {lemma_norm}")
    if gloss:
        lines.append(f"Gloss: {gloss}")
    if quran_refs:
        lines.append(f"Quran: {quran_refs}")
    if note:
        lines.append(f"Note: {note}")
    return "\n".join(lines)


def build_sql(
    data: dict[str, Any],
    source_code: str,
    title: str,
    author: str,
    language: str,
    source_type: str,
) -> tuple[str, int, int]:
    items = data.get("items")
    if not isinstance(items, list):
        raise ValueError("Input JSON must contain an array at `items`.")
    if not items:
        raise ValueError("Input JSON has no items.")

    source_canonical = f"source|{source_code}"
    ar_u_source = sha256_hex(source_canonical)

    page_items: dict[int, list[dict[str, Any]]] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        page = page_from_item(item)
        if page is None:
            raise ValueError(f"Missing page in item: {json.dumps(item, ensure_ascii=False)[:240]}")
        page_items.setdefault(page, []).append(item)

    pages = sorted(page_items.keys())
    if not pages:
        raise ValueError("No page numbers found in items.")

    lines: list[str] = []
    lines.append("PRAGMA foreign_keys = ON;")
    lines.append("")

    lines.append(
        "INSERT INTO ar_u_sources "
        "(ar_u_source, canonical_input, source_code, title, author, language, type) "
        f"VALUES ({sql_quote(ar_u_source)}, {sql_quote(source_canonical)}, {sql_quote(source_code)}, "
        f"{sql_quote(title)}, {sql_quote(author)}, {sql_quote(language)}, {sql_quote(source_type)}) "
        "ON CONFLICT(ar_u_source) DO UPDATE SET "
        "canonical_input=excluded.canonical_input, "
        "source_code=excluded.source_code, "
        "title=excluded.title, "
        "author=excluded.author, "
        "language=excluded.language, "
        "type=excluded.type, "
        "updated_at=datetime('now');"
    )
    lines.append("")

    # Page-level chunks from note items (one chunk per source page).
    for page in pages:
        rows = page_items[page]
        block_text = "\n\n".join(format_chunk_block(item, i + 1) for i, item in enumerate(rows))
        heading_raw = f"Page {page}"
        heading_norm = norm_text(heading_raw)
        chunk_id = f"{source_code}:p:{page:04d}"
        locator = f"pdf_page:{page}"
        chunk_meta = {
            "collection": data.get("collection"),
            "source_file": data.get("source_file"),
            "surah": data.get("surah"),
            "surah_name_en": data.get("surah_name_en"),
            "ayah_range": data.get("ayah_range"),
            "item_count": len(rows),
            "notes_kind": "verbal_idiom_page_notes",
        }

        lines.append(
            "INSERT INTO ar_source_chunks "
            "(chunk_id, ar_u_source, page_no, locator, heading_raw, heading_norm, text, meta_json) "
            f"VALUES ({sql_quote(chunk_id)}, {sql_quote(ar_u_source)}, {page}, {sql_quote(locator)}, "
            f"{sql_quote(heading_raw)}, {sql_quote(heading_norm)}, {sql_quote(block_text)}, {sql_quote(chunk_meta)}) "
            "ON CONFLICT(chunk_id) DO UPDATE SET "
            "ar_u_source=excluded.ar_u_source, "
            "page_no=excluded.page_no, "
            "locator=excluded.locator, "
            "heading_raw=excluded.heading_raw, "
            "heading_norm=excluded.heading_norm, "
            "text=excluded.text, "
            "meta_json=excluded.meta_json, "
            "updated_at=datetime('now');"
        )

    lines.append("")

    # Lexicon + evidence rows from each item.
    evidence_count = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        canonical_input = str(item.get("canonical_input") or "").strip()
        if not canonical_input:
            raise ValueError("Item missing canonical_input.")

        lexicon_id = sha256_hex(canonical_input)
        g = item.get("gloss_secondary_json")
        if not isinstance(g, dict):
            g = {}
        construction = str(g.get("construction") or "").strip()
        lemma_ar = str(item.get("lemma_ar") or "").strip()
        lemma_norm = str(item.get("lemma_norm") or "").strip()
        surface_ar = construction or lemma_ar or str(item.get("sense_key") or "").strip()
        surface_norm = norm_text(surface_ar) or lemma_norm

        pos = str(item.get("pos") or "").strip().lower() or None
        root_norm = str(item.get("root_norm") or "").strip() or None
        valency_id = str(item.get("valency_id") or "").strip() or None
        sense_key = str(item.get("sense_key") or "").strip()
        if not sense_key:
            raise ValueError(f"Item missing sense_key: {canonical_input}")

        gloss_primary = str(item.get("gloss_primary") or "").strip() or None
        note = str(g.get("note") or "").strip() or None
        page = page_from_item(item)
        if page is None:
            raise ValueError(f"Item missing page: {canonical_input}")
        chunk_id = f"{source_code}:p:{page:04d}"

        q_examples = g.get("quran_examples") if isinstance(g.get("quran_examples"), list) else []
        references_json = {
            "source_code": source_code,
            "source_file": data.get("source_file"),
            "page": page,
            "quran_examples": q_examples,
        }
        meta_json = {
            "importer": "import_verbal_idioms_notes.py",
            "collection": data.get("collection"),
            "surah": data.get("surah"),
            "source_file": data.get("source_file"),
            "original_item": item,
        }

        lines.append(
            "INSERT INTO ar_u_lexicon "
            "("
            "ar_u_lexicon, canonical_input, unit_type, surface_ar, surface_norm, "
            "lemma_ar, lemma_norm, pos, root_norm, valency_id, sense_key, "
            "gloss_primary, gloss_secondary_json, usage_notes, "
            "expression_type, expression_text, expression_meaning, references_json, meta_json"
            ") "
            f"VALUES ({sql_quote(lexicon_id)}, {sql_quote(canonical_input)}, 'verbal_idiom', "
            f"{sql_quote(surface_ar)}, {sql_quote(surface_norm)}, "
            f"{sql_quote(lemma_ar or None)}, {sql_quote(lemma_norm or None)}, {sql_quote(pos)}, "
            f"{sql_quote(root_norm)}, {sql_quote(valency_id)}, {sql_quote(sense_key)}, "
            f"{sql_quote(gloss_primary)}, {sql_quote(g)}, {sql_quote(note)}, "
            f"{sql_quote('verbal_idiom')}, {sql_quote(construction or None)}, {sql_quote(gloss_primary)}, "
            f"{sql_quote(references_json)}, {sql_quote(meta_json)}) "
            "ON CONFLICT(ar_u_lexicon) DO UPDATE SET "
            "canonical_input=excluded.canonical_input, "
            "unit_type=excluded.unit_type, "
            "surface_ar=excluded.surface_ar, "
            "surface_norm=excluded.surface_norm, "
            "lemma_ar=excluded.lemma_ar, "
            "lemma_norm=excluded.lemma_norm, "
            "pos=excluded.pos, "
            "root_norm=excluded.root_norm, "
            "valency_id=excluded.valency_id, "
            "sense_key=excluded.sense_key, "
            "gloss_primary=excluded.gloss_primary, "
            "gloss_secondary_json=excluded.gloss_secondary_json, "
            "usage_notes=excluded.usage_notes, "
            "expression_type=excluded.expression_type, "
            "expression_text=excluded.expression_text, "
            "expression_meaning=excluded.expression_meaning, "
            "references_json=excluded.references_json, "
            "meta_json=excluded.meta_json, "
            "updated_at=datetime('now');"
        )

        extract_parts: list[str] = []
        if construction:
            extract_parts.append(construction)
        if gloss_primary:
            extract_parts.append(gloss_primary)
        qtext = quran_examples_text(g)
        if qtext:
            extract_parts.append(f"Quran: {qtext}")
        extract_text = " | ".join(extract_parts) or construction or gloss_primary

        evidence_meta = {
            "canonical_input": canonical_input,
            "sense_key": sense_key,
            "quran_examples": q_examples,
            "source_file": data.get("source_file"),
        }

        lines.append(
            "INSERT INTO ar_u_lexicon_evidence "
            "(ar_u_lexicon, chunk_id, ar_u_source, page_no, link_role, extract_text, notes, meta_json) "
            f"VALUES ({sql_quote(lexicon_id)}, {sql_quote(chunk_id)}, {sql_quote(ar_u_source)}, {page}, "
            f"{sql_quote('verbal_idiom_note')}, {sql_quote(extract_text)}, {sql_quote(note)}, {sql_quote(evidence_meta)}) "
            "ON CONFLICT(ar_u_lexicon, chunk_id) DO UPDATE SET "
            "ar_u_source=excluded.ar_u_source, "
            "page_no=excluded.page_no, "
            "link_role=excluded.link_role, "
            "extract_text=excluded.extract_text, "
            "notes=excluded.notes, "
            "meta_json=excluded.meta_json, "
            "updated_at=datetime('now');"
        )
        evidence_count += 1

    lines.append("")
    lines.append(f"DELETE FROM ar_source_chunks_fts WHERE source_code = {sql_quote(source_code)};")
    lines.append(
        "INSERT INTO ar_source_chunks_fts(chunk_id, source_code, heading_norm, text) "
        "SELECT c.chunk_id, s.source_code, COALESCE(c.heading_norm, ''), c.text "
        "FROM ar_source_chunks c "
        "JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source "
        f"WHERE s.source_code = {sql_quote(source_code)};"
    )
    lines.append(f"DELETE FROM ar_u_lexicon_evidence_fts WHERE source_code = {sql_quote(source_code)};")
    lines.append(
        "INSERT INTO ar_u_lexicon_evidence_fts(ar_u_lexicon, chunk_id, source_code, extract_text, notes) "
        "SELECT e.ar_u_lexicon, e.chunk_id, s.source_code, COALESCE(e.extract_text, ''), COALESCE(e.notes, '') "
        "FROM ar_u_lexicon_evidence e "
        "JOIN ar_u_sources s ON s.ar_u_source = e.ar_u_source "
        f"WHERE s.source_code = {sql_quote(source_code)};"
    )

    return "\n".join(lines) + "\n", len(pages), evidence_count


def run() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to surah verbal idioms JSON file")
    parser.add_argument("--source-code", default="SRC:MIR_VERBAL_IDIOMS")
    parser.add_argument("--title", default="Verbal Idioms (Mushaf Order)")
    parser.add_argument("--author", default="Professor Mir")
    parser.add_argument("--language", default="en")
    parser.add_argument("--type", default="book")
    parser.add_argument("--database", default="knowledgemap")
    parser.add_argument("--sql-out", default="/tmp/import_verbal_idioms_notes.sql")
    parser.add_argument("--apply", action="store_true", help="Execute generated SQL with wrangler")
    parser.add_argument("--remote", action="store_true", help="Use --remote for wrangler execution")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    data = json.loads(input_path.read_text(encoding="utf-8"))
    sql, chunk_count, evidence_count = build_sql(
        data=data,
        source_code=args.source_code,
        title=args.title,
        author=args.author,
        language=args.language,
        source_type=args.type,
    )

    out_path = Path(args.sql_out)
    out_path.write_text(sql, encoding="utf-8")
    print(f"Wrote SQL: {out_path}")
    print(f"Source code: {args.source_code}")
    print(f"Chunks: {chunk_count}")
    print(f"Evidence rows: {evidence_count}")

    if args.apply:
        cmd = ["wrangler", "d1", "execute", args.database]
        if args.remote:
            cmd.append("--remote")
        cmd.extend(["--file", str(out_path)])
        print("Running:", " ".join(cmd))
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    run()
