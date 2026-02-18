# Book Search API

Route: `GET /ar/book-search`  
Auth: `Authorization: Bearer <jwt>`

Update Route: `PUT /ar/book-search`  
Auth: `Authorization: Bearer <jwt>`

## Modes

`mode=sources`
- Lists books in `ar_u_sources`.
- Params: `q`, `limit`, `offset`.

`mode=pages`
- Lists page chunks from `ar_source_chunks` (pages only).
- Params: `source_code`, `heading_norm`, `page_from`, `page_to`, `limit`, `offset`.

`mode=toc`
- Lists table-of-contents rows from `ar_source_toc`.
- Params: `source_code`, `q`, `heading_norm`, `page_from`, `page_to`, `limit`, `offset`.

`mode=index`
- Lists term index rows from `ar_source_index`.
- Params: `source_code`, `q`, `heading_norm`, `page_from`, `page_to`, `limit`, `offset`.

`mode=chunks` (default)
- Searches page chunks via `ar_source_chunks_fts`.
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

## Update Chunk

`PUT /ar/book-search`
- Updates one chunk row in `ar_source_chunks`.
- Required body field: `chunk_id`
- Editable fields:
  - `page_no` (integer or `null`)
  - `heading_raw` (string or `null`)
  - `heading_norm` (string or `null`)  
    If omitted but `heading_raw` is provided, `heading_norm` is auto-derived.
  - `locator` (string or `null`)
  - `chunk_type` (`grammar | literature | lexicon | reference | other | null`)
  - `text` (string)
- Response returns updated reader payload (`chunk` + `nav`).

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

List TOC for one book:

```http
GET /ar/book-search?mode=toc&source_code=SRC:SINAI_KEY_TERMS
```

List index terms for one book:

```http
GET /ar/book-search?mode=index&source_code=SRC:SINAI_KEY_TERMS&heading_norm=ibrah
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

Update a chunk:

```http
PUT /ar/book-search
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "chunk_id": "SRC:SINAI_KEY_TERMS:p:0150",
  "heading_raw": "Page 150",
  "chunk_type": "lexicon",
  "text": "Updated text..."
}
```
