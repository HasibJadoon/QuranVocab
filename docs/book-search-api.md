# Book Search API

Route: `GET /ar/book-search`  
Auth: `Authorization: Bearer <jwt>`

## Modes

`mode=sources`
- Lists books in `ar_u_sources`.
- Params: `q`, `limit`, `offset`.

`mode=chunks` (default)
- Searches raw OCR/page chunks via `ar_source_chunks_fts`.
- Params: `q`, `source_code`, `page_from`, `page_to`, `heading_norm`, `limit`, `offset`.

`mode=evidence`
- Searches curated snippets/notes via `ar_u_lexicon_evidence_fts`.
- Params: `q`, `source_code`, `ar_u_lexicon`, `page_from`, `page_to`, `limit`, `offset`.

`mode=lexicon`
- Lists evidence rows for one lexicon id, grouped by source in sort order.
- Params: `ar_u_lexicon` (required), `source_code`, `limit`, `offset`.

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
