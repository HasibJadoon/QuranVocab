# Arabic Qur’an Lesson — UI → Data Storage Map

This document defines where each part of a Qur’an lesson is edited in the UI and where it is stored in the database.

Scope: Surah-based Qur’an lessons (e.g. Surah Yusuf 12:1–7).

---

## Design Principles

- Lessons do **not** own Qur’an text  
- Universal language data is **reusable**  
- Lessons author **pedagogy only**  
- Draft ≠ broken (schema must always be valid)

---

## UI Flow → Database Mapping

| UI Flow / Screen | What the user edits | Stored in table |
|---|---|---|
| Lesson List / Create Lesson | `lesson_type`, `title`, `title_ar`, `source`, `status`, `subtype`, `difficulty`, `reference` | `ar_lessons` |
| Lesson Meta Panel | Title, Arabic title, difficulty, subtype, status, reference label | `ar_lessons.lesson_json` |
| Passage / Units Picker | Passage unit + ayah units (order, range) | `ar_lessons.lesson_json.units` *(or `ar_lesson_units` if normalized)* |
| Reading Tab (Ayah View) | Display only (no authoring) | `ar_quran_text`, `ar_quran_translations` |
| Reading Tab (Optional Override) | Per-lesson notes or translation override | `ar_lessons.lesson_json.text` |
| Tokens / Lemmas Panel | View only | `ar_u_tokens`, `ar_occ_tokens` |
| Sentence Builder Tab | Sentence text, notes, order, unit binding | `ar_lesson_sentences` *(recommended)* |
| Universal Sentence Library | Canonical sentence definitions | `ar_u_sentences` |
| Sentence ↔ Qur’an Binding | Sentence occurrence per ayah / passage | `ar_occ_sentences` |
| Comprehension Tab | MCQs, analytical & reflective questions | `ar_lesson_questions` *(or embedded in `lesson_json`)* |
| Analysis Tab (Tokens / Spans / Vocab) | Generated (not authored) | `ar_occ_tokens`, `ar_occ_spans`, `ar_u_spans` |
| Span Builder (Idāfa / Ṣifa) | Curated phrase spans (if manual) | `ar_u_spans`, `ar_occ_spans` |
| Publish / Status Change | Draft → Published | `ar_lessons.status`, `ar_lessons.updated_at` |

---

## Table Responsibilities

| Layer | Responsibility |
|---|---|
| `ar_quran_*` | Qur’an text and translations (immutable) |
| `ar_u_*` | Universal language atoms (tokens, spans, sentences) |
| `ar_occ_*` | Location of atoms within the Qur’an |
| `ar_lessons` | Lesson structure and metadata |
| `ar_lesson_*` | Lesson-specific authored content |

---

## Non-Negotiable Rules

- UI must never save invalid JSON  
- Draft lessons must be structurally complete  
- Qur’an text is never duplicated in lessons  
- Linguistic analysis is never authored inside lessons  

---

## Minimal Flow Model

Qur’an Text
↓
Universal Language (tokens / spans / sentences)
↓
Occurrences (where in Qur’an)
↓
Lesson (how to teach)
---

This file is the authoritative reference for Qur’an lesson architecture.
