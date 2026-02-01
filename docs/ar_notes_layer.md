# Notes & Citations Layer

## Objective
Keep `ar_u_*` tables pure (identity + meaning) while giving scholars a flexible way to attach **excerpts, citations, and remarks** to any linguistic object.

## Tables

1. **`ar_sources`** — metadata about the reference (book, article, lexicon, pdf, website, etc.).
2. **`ar_notes`** — the actual excerpt/commentary plus structured capture (`extra_json` for bullet points, tags, confidence, etc.).
3. **`ar_note_targets`** — the semantic edge between a note and any target (root, token, lexicon sense, occurrence, worldview concept). It carries relationship metadata (`relation`, `strength`, `share_scope`, `edge_note`, `extra_json`).

## Flow

- **Create a source** (`ar_sources`) when you import a book/article/lexicon entry.
- **Extract a note**: fill `excerpt`, `commentary`, optional `extra_json`.
- **Link the note** via `ar_note_targets` to as many targets as needed, specifying `target_type` (e.g., `u_root`, `u_lexicon`, `occ_token`), `relation` (supports, contrasts, etc.), and optional context (`container_id`, `ref`, `share_scope`).
- Query the “root page” UI by joining `ar_u_roots`, their derived forms, and all notes linked via `ar_note_targets` (filter by target_type and relation).
- Use `extra_json` on `ar_notes` for structured data (tags, outlines) and on `ar_note_targets` for UI hints (pins, ranking, share intent).

## Dos & Don’ts

- **Do** keep the linguistic tables (roots, lexicon, tokens) focused on canonical data.
- **Do** store provenance and extended metadata in `ar_sources.extra_json` or `ar_notes.extra_json`.
- **Do** use `ar_note_targets` to describe how a note relates to a target: `relation`, `edge_note`, `share_scope`, and `extra_json` should capture the semantics of that link.
- **Do** allow a single note to target multiple objects (root + sense + occurrence).
- **Don’t** add notes/text fields to `ar_u_roots`/`ar_u_lexicon`; instead, fetch notes via the new link table.
- **Don’t** encode relationship semantics in `ar_notes`; keep them in `ar_note_targets`.

## Example

Lane-style page:

- Root header: `ar_u_roots`.
- Family list: `ar_u_tokens` / `ar_u_lexicon`.
- Notes section: `ar_notes` joined via `ar_note_targets` filtered by `target_type='u_root'`, optionally including notes targeted to child tokens/senses.

Academic note (q-d-s) flow:

1. insert `ar_sources` entry with article metadata
2. create `ar_notes` excerpt + `extra_json`
3. link to target(s) using `ar_note_targets` with `relation='contrasts'`, `share_scope='public'`, and edge metadata for UI ranking

This keeps the system scalable, shareable, and ready for future layers (occurrences, worldview concepts, private groups).
