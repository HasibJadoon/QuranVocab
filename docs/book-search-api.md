# Book Search API

Route: `GET /ar/book-search`  
Auth: `Authorization: Bearer <jwt>`

## Modes

`mode=sources`
- Lists books in `ar_u_sources`.
- Params: `q`, `limit`, `offset`.

`mode=chunks` (default)
- Searches raw OCR/page chunks via `ar_source_chunks_fts`.
- Params: `q`, `source_code`, `chunk_type`, `page_from`, `page_to`, `heading_norm`, `limit`, `offset`.
  - Allowed `chunk_type`: `grammar`, `literature`, `lexicon`, `reference`, `other`.

`mode=evidence`
- Searches curated snippets/notes via `ar_u_lexicon_evidence_fts`.
- Params: `q`, `source_code`, `ar_u_lexicon`, `heading_norm`, `page_from`, `page_to`, `limit`, `offset`.

`mode=lexicon`
- Lists evidence rows for one lexicon id, grouped by source in sort order.
- Params: `ar_u_lexicon` (required), `source_code`, `limit`, `offset`.

`mode=reader`
- Loads one full chunk for the reader panel (plus prev/next pointers in same source).
- Params: `chunk_id` OR (`source_code` + `page_no`).

## Examples

List books:

```http
GET /ar/book-search?mode=sources
```

Search within one book:

```http
GET /ar/book-search?mode=chunks&source_code=SRC:HDO_2008&q=tazki*%20OR%20تزكي*
```

Search within one book + page range:

```http
GET /ar/book-search?mode=chunks&source_code=SRC:HDO_2008&page_from=150&page_to=220&q=purif*%20OR%20تزكي*
```

Search within one book + chunk type:

```http
GET /ar/book-search?mode=chunks&source_code=SRC:SINAI_KEY_TERMS&chunk_type=lexicon&q=clear%20OR%20mubin
```

Search within one book + heading:

```http
GET /ar/book-search?mode=chunks&source_code=SRC:HDO_2008&heading_norm=page%20188&q=quran
```

Search curated evidence:

```http
GET /ar/book-search?mode=evidence&source_code=SRC:HDO_2008&q=clear%20OR%20mubin%20OR%20مبين
```

All evidence for a lexicon entry:

```http
GET /ar/book-search?mode=lexicon&ar_u_lexicon=<LEXICON_ID>
```

Load chunk reader by id:

```http
GET /ar/book-search?mode=reader&chunk_id=SRC:SINAI_KEY_TERMS:p:0150
```
