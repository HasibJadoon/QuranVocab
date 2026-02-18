import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

type SearchMode = 'sources' | 'pages' | 'toc' | 'index' | 'chunks' | 'evidence' | 'lexicon' | 'reader';
type ChunkType = 'grammar' | 'literature' | 'lexicon' | 'reference' | 'other';

type SqlBind = string | number | null;
const CHUNK_TYPE_SET = new Set<ChunkType>(['grammar', 'literature', 'lexicon', 'reference', 'other']);

function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\u00AD\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeChunkType(value: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeMode(value: string | null): SearchMode {
  const mode = (value ?? 'chunks').trim().toLowerCase();
  if (
    mode === 'sources' ||
    mode === 'pages' ||
    mode === 'toc' ||
    mode === 'index' ||
    mode === 'chunks' ||
    mode === 'evidence' ||
    mode === 'lexicon' ||
    mode === 'reader'
  ) {
    return mode;
  }
  return 'chunks';
}

type SourceRow = {
  source_code: string;
  title: string;
  author: string | null;
  publication_year: number | null;
  language: string | null;
  type: string;
  chunk_count: number;
};

type ChunkRow = {
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  locator: string | null;
  heading_raw: string | null;
  heading_norm: string | null;
  chunk_type: ChunkType;
  hit: string | null;
  rank: number | null;
};

type PageRow = {
  chunk_id: string;
  source_code: string;
  page_no: number | null;
  heading_raw: string | null;
  heading_norm: string | null;
  locator: string | null;
};

type TocRow = {
  toc_id: string;
  source_code: string;
  depth: number;
  index_path: string;
  title_raw: string;
  title_norm: string;
  page_no: number | null;
  locator: string | null;
  pdf_page_index: number | null;
  target_chunk_id: string | null;
};

type IndexRow = {
  index_id: string;
  source_code: string;
  term_raw: string;
  term_norm: string;
  term_ar: string | null;
  term_ar_guess: string | null;
  head_chunk_id: string | null;
  index_page_no: number | null;
  index_locator: string | null;
  page_refs_json: string;
  variants_json: string | null;
  target_chunk_id: string | null;
};

type EvidenceRow = {
  ar_u_lexicon: string;
  evidence_id: string;
  chunk_id: string | null;
  source_code: string;
  page_no: number | null;
  heading_raw: string | null;
  heading_norm: string | null;
  link_role: string;
  extract_hit: string | null;
  notes_hit: string | null;
  rank: number | null;
};

type LexiconEvidenceRow = {
  source_code: string;
  title: string;
  chunk_id: string | null;
  page_no: number | null;
  extract_text: string | null;
  notes: string | null;
};

type ReaderChunkRow = {
  chunk_id: string;
  page_no: number | null;
  heading_raw: string | null;
  locator: string | null;
  chunk_type: string | null;
  chunk_scope: string | null;
  parent_chunk_id: string | null;
  text: string;
  source_code: string;
  source_title: string;
};

type ReaderNavRow = {
  chunk_id: string;
  page_no: number | null;
};

type TocReaderRow = {
  toc_id: string;
  ar_u_source: string;
  source_code: string;
  source_title: string;
  depth: number;
  index_path: string;
  title_raw: string;
  page_no: number | null;
  locator: string | null;
  pdf_page_index: number | null;
};

type TocReaderNavRow = {
  toc_id: string;
  page_no: number | null;
};

type ReaderPageTextRow = {
  chunk_id: string;
  page_no: number | null;
  heading_raw: string | null;
  text: string;
};

async function runSourceSearch(db: D1Database, q: string, limit: number, offset: number) {
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];
  if (q) {
    const like = `%${q}%`;
    whereParts.push('(s.source_code LIKE ? OR s.title LIKE ? OR COALESCE(s.author, \'\') LIKE ?)');
    binds.push(like, like, like);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS total FROM ar_u_sources s ${whereClause}`)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      s.source_code,
      s.title,
      s.author,
      s.publication_year,
      s.language,
      s.type,
      COUNT(c.chunk_id) AS chunk_count
    FROM ar_u_sources s
    LEFT JOIN ar_source_chunks c
      ON c.ar_u_source = s.ar_u_source
     AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
    ${whereClause}
    GROUP BY s.ar_u_source
    ORDER BY s.title ASC
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<SourceRow>();

  return {
    ok: true,
    mode: 'sources' as const,
    total,
    limit,
    offset,
    results,
  };
}

async function runChunkSearch(
  db: D1Database,
  q: string,
  sourceCode: string,
  chunkType: string,
  headingNormRaw: string,
  pageFrom: number | null,
  pageTo: number | null,
  limit: number,
  offset: number
) {
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];
  whereParts.push("COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'");

  if (sourceCode) {
    whereParts.push('f.source_code = ?');
    binds.push(sourceCode);
  }
  if (chunkType) {
    whereParts.push('c.chunk_type = ?');
    binds.push(chunkType);
  }
  if (pageFrom !== null) {
    whereParts.push('c.page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('c.page_no <= ?');
    binds.push(pageTo);
  }
  if (headingNormRaw) {
    whereParts.push('c.heading_norm LIKE ?');
    binds.push(`%${normalizeHeading(headingNormRaw)}%`);
  }
  if (q) {
    whereParts.push('ar_source_chunks_fts MATCH ?');
    binds.push(q);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_source_chunks_fts f
    JOIN ar_source_chunks c ON c.chunk_id = f.chunk_id
    ${whereClause}
  `;

  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const hitExpr = q
    ? `snippet(ar_source_chunks_fts, 3, '[', ']', '…', 12) AS hit, bm25(ar_source_chunks_fts) AS rank`
    : `substr(c.text, 1, 260) AS hit, NULL AS rank`;
  const orderBy = q ? 'ORDER BY rank ASC, c.page_no ASC, c.chunk_id ASC' : 'ORDER BY c.page_no ASC, c.chunk_id ASC';

  const dataSql = `
    SELECT
      f.chunk_id,
      f.source_code,
      c.page_no,
      c.locator,
      c.heading_raw,
      c.heading_norm,
      c.chunk_type,
      ${hitExpr}
    FROM ar_source_chunks_fts f
    JOIN ar_source_chunks c ON c.chunk_id = f.chunk_id
    ${whereClause}
    ${orderBy}
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<ChunkRow>();

  return {
    ok: true,
    mode: 'chunks' as const,
    total,
    limit,
    offset,
    filters: {
      source_code: sourceCode || null,
      chunk_type: chunkType || null,
      page_from: pageFrom,
      page_to: pageTo,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
      q: q || null,
    },
    results,
  };
}

async function runPageList(
  db: D1Database,
  sourceCode: string,
  headingNormRaw: string,
  pageFrom: number | null,
  pageTo: number | null,
  limit: number,
  offset: number
) {
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];

  if (sourceCode) {
    whereParts.push('s.source_code = ?');
    binds.push(sourceCode);
  }
  whereParts.push("COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'");
  if (pageFrom !== null) {
    whereParts.push('c.page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('c.page_no <= ?');
    binds.push(pageTo);
  }
  if (headingNormRaw) {
    whereParts.push('c.heading_norm LIKE ?');
    binds.push(`%${normalizeHeading(headingNormRaw)}%`);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_source_chunks c
    JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
    ${whereClause}
  `;
  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      c.chunk_id,
      s.source_code,
      c.page_no,
      c.heading_raw,
      c.heading_norm,
      c.locator
    FROM ar_source_chunks c
    JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
    ${whereClause}
    ORDER BY c.page_no ASC, c.chunk_id ASC
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<PageRow>();

  return {
    ok: true,
    mode: 'pages' as const,
    total,
    limit,
    offset,
    filters: {
      source_code: sourceCode || null,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
      page_from: pageFrom,
      page_to: pageTo,
    },
    results,
  };
}

async function runTocList(
  db: D1Database,
  q: string,
  sourceCode: string,
  headingNormRaw: string,
  pageFrom: number | null,
  pageTo: number | null,
  limit: number,
  offset: number
) {
  const tocPdfPageExpr = `CASE
    WHEN t.locator LIKE 'pdf_page:%' THEN CAST(substr(t.locator, 10) AS INTEGER)
    ELSE NULL
  END`;
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];

  if (sourceCode) {
    whereParts.push('s.source_code = ?');
    binds.push(sourceCode);
  }
  if (pageFrom !== null) {
    whereParts.push('t.page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('t.page_no <= ?');
    binds.push(pageTo);
  }
  if (headingNormRaw) {
    whereParts.push('t.title_norm LIKE ?');
    binds.push(`%${normalizeHeading(headingNormRaw)}%`);
  }
  if (q) {
    const like = `%${q}%`;
    whereParts.push('(t.title_raw LIKE ? OR t.title_norm LIKE ? OR t.index_path LIKE ?)');
    binds.push(like, like, like);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_source_toc t
    JOIN ar_u_sources s ON s.ar_u_source = t.ar_u_source
    ${whereClause}
  `;
  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      t.toc_id,
      s.source_code,
      t.depth,
      t.index_path,
      t.title_raw,
      t.title_norm,
      t.page_no,
      t.locator,
      ${tocPdfPageExpr} AS pdf_page_index,
      COALESCE(
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = t.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND t.page_no IS NOT NULL
            AND p.page_no = t.page_no
          ORDER BY p.chunk_id ASC
          LIMIT 1
        ),
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = t.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND t.locator IS NOT NULL
            AND p.locator = t.locator
          ORDER BY p.page_no ASC, p.chunk_id ASC
          LIMIT 1
        ),
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = t.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND ${tocPdfPageExpr} IS NOT NULL
            AND p.locator LIKE 'pdf_page:%'
            AND CAST(substr(p.locator, 10) AS INTEGER) = ${tocPdfPageExpr}
          ORDER BY p.page_no ASC, p.chunk_id ASC
          LIMIT 1
        ),
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = t.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND ${tocPdfPageExpr} IS NOT NULL
            AND p.locator LIKE 'pdf_page:%'
          ORDER BY ABS(CAST(substr(p.locator, 10) AS INTEGER) - ${tocPdfPageExpr}), p.page_no ASC, p.chunk_id ASC
          LIMIT 1
        )
      ) AS target_chunk_id
    FROM ar_source_toc t
    JOIN ar_u_sources s ON s.ar_u_source = t.ar_u_source
    ${whereClause}
    ORDER BY t.index_path ASC, t.toc_id ASC
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<TocRow>();

  return {
    ok: true,
    mode: 'toc' as const,
    total,
    limit,
    offset,
    filters: {
      source_code: sourceCode || null,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
      page_from: pageFrom,
      page_to: pageTo,
      q: q || null,
    },
    results,
  };
}

async function runIndexList(
  db: D1Database,
  q: string,
  sourceCode: string,
  headingNormRaw: string,
  pageFrom: number | null,
  pageTo: number | null,
  limit: number,
  offset: number
) {
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];

  if (sourceCode) {
    whereParts.push('s.source_code = ?');
    binds.push(sourceCode);
  }
  if (pageFrom !== null) {
    whereParts.push('i.index_page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('i.index_page_no <= ?');
    binds.push(pageTo);
  }
  if (headingNormRaw) {
    whereParts.push('i.term_norm LIKE ?');
    binds.push(`%${normalizeHeading(headingNormRaw)}%`);
  }
  if (q) {
    const like = `%${q}%`;
    whereParts.push(
      '(i.term_raw LIKE ? OR i.term_norm LIKE ? OR COALESCE(i.term_ar, \'\') LIKE ? OR COALESCE(i.term_ar_guess, \'\') LIKE ?)'
    );
    binds.push(like, like, like, like);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_source_index i
    JOIN ar_u_sources s ON s.ar_u_source = i.ar_u_source
    ${whereClause}
  `;
  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      i.index_id,
      s.source_code,
      i.term_raw,
      i.term_norm,
      i.term_ar,
      i.term_ar_guess,
      i.head_chunk_id,
      i.index_page_no,
      i.index_locator,
      i.page_refs_json,
      i.variants_json,
      COALESCE(
        i.head_chunk_id,
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = i.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND i.index_page_no IS NOT NULL
            AND p.page_no = i.index_page_no
          ORDER BY p.chunk_id ASC
          LIMIT 1
        ),
        (
          SELECT p.chunk_id
          FROM ar_source_chunks p
          WHERE p.ar_u_source = i.ar_u_source
            AND COALESCE(json_extract(p.content_json, '$.chunk_scope'), 'page') = 'page'
            AND i.index_locator IS NOT NULL
            AND p.locator = i.index_locator
          ORDER BY p.page_no ASC, p.chunk_id ASC
          LIMIT 1
        )
      ) AS target_chunk_id
    FROM ar_source_index i
    JOIN ar_u_sources s ON s.ar_u_source = i.ar_u_source
    ${whereClause}
    ORDER BY i.term_norm ASC, i.index_id ASC
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<IndexRow>();

  return {
    ok: true,
    mode: 'index' as const,
    total,
    limit,
    offset,
    filters: {
      source_code: sourceCode || null,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
      page_from: pageFrom,
      page_to: pageTo,
      q: q || null,
    },
    results,
  };
}

async function runEvidenceSearch(
  db: D1Database,
  q: string,
  sourceCode: string,
  arULexicon: string,
  headingNormRaw: string,
  pageFrom: number | null,
  pageTo: number | null,
  limit: number,
  offset: number
) {
  const whereParts: string[] = [];
  const binds: SqlBind[] = [];

  if (sourceCode) {
    whereParts.push('ef.source_code = ?');
    binds.push(sourceCode);
  }
  if (arULexicon) {
    whereParts.push('e.ar_u_lexicon = ?');
    binds.push(arULexicon);
  }
  if (headingNormRaw) {
    whereParts.push("COALESCE(e.heading_norm, c.heading_norm, '') LIKE ?");
    binds.push(`%${normalizeHeading(headingNormRaw)}%`);
  }
  if (pageFrom !== null) {
    whereParts.push('e.page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('e.page_no <= ?');
    binds.push(pageTo);
  }
  if (q) {
    whereParts.push('ar_u_lexicon_evidence_fts MATCH ?');
    binds.push(q);
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_u_lexicon_evidence_fts ef
    JOIN ar_u_lexicon_evidence e
      ON e.evidence_id = ef.evidence_id
     AND e.ar_u_lexicon = ef.ar_u_lexicon
    LEFT JOIN ar_source_chunks c
      ON c.chunk_id = e.chunk_id
    ${whereClause}
  `;

  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const hitExpr = q
    ? `snippet(ar_u_lexicon_evidence_fts, 4, '[', ']', '…', 12) AS extract_hit,
       snippet(ar_u_lexicon_evidence_fts, 5, '[', ']', '…', 12) AS notes_hit,
       bm25(ar_u_lexicon_evidence_fts) AS rank`
    : `substr(COALESCE(e.extract_text, ''), 1, 260) AS extract_hit,
       substr(COALESCE(e.note_md, ''), 1, 260) AS notes_hit,
       NULL AS rank`;
  const orderBy = q
    ? 'ORDER BY rank ASC, e.page_no ASC, COALESCE(e.chunk_id, e.evidence_id) ASC'
    : 'ORDER BY e.page_no ASC, COALESCE(e.chunk_id, e.evidence_id) ASC';

  const dataSql = `
    SELECT
      e.ar_u_lexicon,
      e.evidence_id,
      e.chunk_id,
      ef.source_code,
      e.page_no,
      COALESCE(e.heading_raw, c.heading_raw) AS heading_raw,
      COALESCE(e.heading_norm, c.heading_norm) AS heading_norm,
      e.link_role,
      ${hitExpr}
    FROM ar_u_lexicon_evidence_fts ef
    JOIN ar_u_lexicon_evidence e
      ON e.evidence_id = ef.evidence_id
     AND e.ar_u_lexicon = ef.ar_u_lexicon
    LEFT JOIN ar_source_chunks c
      ON c.chunk_id = e.chunk_id
    ${whereClause}
    ${orderBy}
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<EvidenceRow>();

  return {
    ok: true,
    mode: 'evidence' as const,
    total,
    limit,
    offset,
    filters: {
      source_code: sourceCode || null,
      ar_u_lexicon: arULexicon || null,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
      page_from: pageFrom,
      page_to: pageTo,
      q: q || null,
    },
    results,
  };
}

async function runLexiconEvidence(
  db: D1Database,
  arULexicon: string,
  sourceCode: string,
  limit: number,
  offset: number
) {
  if (!arULexicon) {
    return new Response(JSON.stringify({ ok: false, error: 'ar_u_lexicon is required for mode=lexicon' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const whereParts = ['e.ar_u_lexicon = ?'];
  const binds: SqlBind[] = [arULexicon];
  if (sourceCode) {
    whereParts.push('s.source_code = ?');
    binds.push(sourceCode);
  }
  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM ar_u_lexicon_evidence e
    LEFT JOIN ar_u_sources s ON s.ar_u_source = e.source_id
    ${whereClause}
  `;
  const countRow = await db.prepare(countSql).bind(...binds).first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      COALESCE(s.source_code, '') AS source_code,
      COALESCE(s.title, '') AS title,
      e.chunk_id,
      e.page_no,
      e.extract_text,
      e.note_md AS notes
    FROM ar_u_lexicon_evidence e
    LEFT JOIN ar_u_sources s ON s.ar_u_source = e.source_id
    ${whereClause}
    ORDER BY COALESCE(s.source_code, '') ASC, e.page_no ASC, COALESCE(e.chunk_id, e.evidence_id) ASC
    LIMIT ?
    OFFSET ?
  `;

  const { results = [] } = await db
    .prepare(dataSql)
    .bind(...binds, limit, offset)
    .all<LexiconEvidenceRow>();

  return new Response(
    JSON.stringify({
      ok: true,
      mode: 'lexicon',
      total,
      limit,
      offset,
      filters: {
        ar_u_lexicon: arULexicon,
        source_code: sourceCode || null,
      },
      results,
    }),
    { headers: jsonHeaders }
  );
}

async function runReaderChunk(
  db: D1Database,
  chunkId: string,
  sourceCode: string,
  pageNo: number | null,
  tocId: string
) {
  const emptyPayload = {
    ok: true,
    mode: 'reader' as const,
    chunk: null,
    nav: {
      prev_chunk_id: null,
      prev_page_no: null,
      next_chunk_id: null,
      next_page_no: null,
      prev_toc_id: null,
      next_toc_id: null,
    },
  };

  if (tocId) {
    const toc = await db
      .prepare(
        `
          SELECT
            t.toc_id,
            t.ar_u_source,
            s.source_code,
            s.title AS source_title,
            t.depth,
            t.index_path,
            t.title_raw,
            t.page_no,
            t.locator,
            CASE
              WHEN t.locator LIKE 'pdf_page:%' THEN CAST(substr(t.locator, 10) AS INTEGER)
              ELSE NULL
            END AS pdf_page_index
          FROM ar_source_toc t
          JOIN ar_u_sources s ON s.ar_u_source = t.ar_u_source
          WHERE t.toc_id = ?
          LIMIT 1
        `
      )
      .bind(tocId)
      .first<TocReaderRow>();

    if (!toc) {
      return emptyPayload;
    }

    let startPage = toc.page_no;
    if (startPage === null && toc.locator) {
      const byLocator = await db
        .prepare(
          `
            SELECT c.page_no
            FROM ar_source_chunks c
            WHERE c.ar_u_source = ?
              AND c.locator = ?
              AND c.page_no IS NOT NULL
              AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
            ORDER BY c.page_no ASC, c.chunk_id ASC
            LIMIT 1
          `
        )
        .bind(toc.ar_u_source, toc.locator)
        .first<{ page_no: number | null }>();
      startPage = byLocator?.page_no ?? null;
    }

    if (startPage === null && toc.pdf_page_index !== null) {
      const byPdfPage = await db
        .prepare(
          `
            SELECT c.page_no
            FROM ar_source_chunks c
            WHERE c.ar_u_source = ?
              AND c.locator LIKE 'pdf_page:%'
              AND c.page_no IS NOT NULL
              AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
            ORDER BY ABS(CAST(substr(c.locator, 10) AS INTEGER) - ?), c.page_no ASC, c.chunk_id ASC
            LIMIT 1
          `
        )
        .bind(toc.ar_u_source, toc.pdf_page_index)
        .first<{ page_no: number | null }>();
      startPage = byPdfPage?.page_no ?? null;
    }

    const prevToc = startPage === null
      ? await db
          .prepare(
            `
              SELECT t.toc_id, t.page_no
              FROM ar_source_toc t
              WHERE t.ar_u_source = ?
                AND t.toc_id < ?
              ORDER BY t.toc_id DESC
              LIMIT 1
            `
          )
          .bind(toc.ar_u_source, toc.toc_id)
          .first<TocReaderNavRow>()
      : await db
          .prepare(
            `
              SELECT t.toc_id, t.page_no
              FROM ar_source_toc t
              WHERE t.ar_u_source = ?
                AND t.page_no IS NOT NULL
                AND (t.page_no < ? OR (t.page_no = ? AND t.toc_id < ?))
              ORDER BY t.page_no DESC, t.toc_id DESC
              LIMIT 1
            `
          )
          .bind(toc.ar_u_source, startPage, startPage, toc.toc_id)
          .first<TocReaderNavRow>();

    const nextToc = startPage === null
      ? await db
          .prepare(
            `
              SELECT t.toc_id, t.page_no
              FROM ar_source_toc t
              WHERE t.ar_u_source = ?
                AND t.toc_id > ?
              ORDER BY t.toc_id ASC
              LIMIT 1
            `
          )
          .bind(toc.ar_u_source, toc.toc_id)
          .first<TocReaderNavRow>()
      : await db
          .prepare(
            `
              SELECT t.toc_id, t.page_no
              FROM ar_source_toc t
              WHERE t.ar_u_source = ?
                AND t.page_no IS NOT NULL
                AND (t.page_no > ? OR (t.page_no = ? AND t.toc_id > ?))
              ORDER BY t.page_no ASC, t.toc_id ASC
              LIMIT 1
            `
          )
          .bind(toc.ar_u_source, startPage, startPage, toc.toc_id)
          .first<TocReaderNavRow>();

    if (startPage === null) {
      return {
        ok: true,
        mode: 'reader' as const,
        chunk: {
          chunk_id: `toc:${toc.toc_id}`,
          page_no: null,
          page_to: null,
          heading_raw: toc.title_raw,
          locator: toc.locator,
          chunk_type: 'toc',
          text: `No linked page found for TOC entry "${toc.title_raw}".`,
          source_code: toc.source_code,
          source_title: toc.source_title,
          reader_scope: 'toc' as const,
          toc_id: toc.toc_id,
        },
        nav: {
          prev_chunk_id: null,
          prev_page_no: prevToc?.page_no ?? null,
          next_chunk_id: null,
          next_page_no: nextToc?.page_no ?? null,
          prev_toc_id: prevToc?.toc_id ?? null,
          next_toc_id: nextToc?.toc_id ?? null,
        },
      };
    }

    const nextPageStart = nextToc?.page_no ?? null;
    const endPage = nextPageStart !== null ? Math.max(startPage, nextPageStart - 1) : null;
    const { results: pages = [] } = await db
      .prepare(
        `
          SELECT
            c.chunk_id,
            c.page_no,
            c.heading_raw,
            c.text
          FROM ar_source_chunks c
          WHERE c.ar_u_source = ?
            AND c.page_no IS NOT NULL
            AND c.page_no >= ?
            AND (? IS NULL OR c.page_no <= ?)
            AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
          ORDER BY c.page_no ASC, c.chunk_id ASC
        `
      )
      .bind(toc.ar_u_source, startPage, endPage, endPage)
      .all<ReaderPageTextRow>();

    const text =
      pages.length > 0
        ? pages
            .map((row) => {
              const pageLabel = row.page_no === null ? 'Page —' : `Page ${row.page_no}`;
              const heading = row.heading_raw?.trim() ? ` | ${row.heading_raw.trim()}` : '';
              return `===== ${pageLabel}${heading} =====\n${row.text}`;
            })
            .join('\n\n')
        : `No page chunks found in TOC range${endPage === null ? '' : ` ${startPage}-${endPage}`}.`;

    return {
      ok: true,
      mode: 'reader' as const,
      chunk: {
        chunk_id: `toc:${toc.toc_id}`,
        page_no: startPage,
        page_to: endPage,
        heading_raw: toc.title_raw,
        locator: toc.locator,
        chunk_type: 'toc',
        text,
        source_code: toc.source_code,
        source_title: toc.source_title,
        reader_scope: 'toc' as const,
        toc_id: toc.toc_id,
      },
      nav: {
        prev_chunk_id: null,
        prev_page_no: prevToc?.page_no ?? null,
        next_chunk_id: null,
        next_page_no: nextToc?.page_no ?? null,
        prev_toc_id: prevToc?.toc_id ?? null,
        next_toc_id: nextToc?.toc_id ?? null,
      },
    };
  }

  const readerSelect = `
    SELECT
      c.chunk_id,
      c.page_no,
      c.heading_raw,
      c.locator,
      c.chunk_type,
      COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') AS chunk_scope,
      json_extract(c.content_json, '$.parent_chunk_id') AS parent_chunk_id,
      c.text,
      s.source_code,
      s.title AS source_title
    FROM ar_source_chunks c
    JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
  `;

  let chunk: ReaderChunkRow | null = null;

  if (chunkId) {
    chunk = await db
      .prepare(
        `
          ${readerSelect}
          WHERE c.chunk_id = ?
          LIMIT 1
        `
      )
      .bind(chunkId)
      .first<ReaderChunkRow>();
  }

  if (!chunk && sourceCode && pageNo !== null) {
    chunk = await db
      .prepare(
        `
          ${readerSelect}
          WHERE s.source_code = ?
            AND c.page_no = ?
          ORDER BY c.chunk_id ASC
          LIMIT 1
        `
      )
      .bind(sourceCode, pageNo)
      .first<ReaderChunkRow>();
  }

  // TOC/term rows are navigation handles: resolve to a concrete page chunk.
  if (chunk && (chunk.chunk_scope === 'toc' || chunk.chunk_scope === 'term')) {
    let targetChunk: ReaderChunkRow | null = null;

    if (chunk.parent_chunk_id) {
      targetChunk = await db
        .prepare(
          `
            ${readerSelect}
            WHERE c.chunk_id = ?
              AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
            LIMIT 1
          `
        )
        .bind(chunk.parent_chunk_id)
        .first<ReaderChunkRow>();
    }

    if (!targetChunk && chunk.locator) {
      targetChunk = await db
        .prepare(
          `
            ${readerSelect}
            WHERE s.source_code = ?
              AND c.locator = ?
              AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
            ORDER BY c.page_no ASC, c.chunk_id ASC
            LIMIT 1
          `
        )
        .bind(chunk.source_code, chunk.locator)
        .first<ReaderChunkRow>();
    }

    if (!targetChunk && chunk.locator) {
      const locatorMatch = chunk.locator.match(/pdf_page:(\d+)/i);
      const locatorIndex = locatorMatch ? Number.parseInt(locatorMatch[1], 10) : Number.NaN;
      if (Number.isFinite(locatorIndex)) {
        targetChunk = await db
          .prepare(
            `
              ${readerSelect}
              WHERE s.source_code = ?
                AND c.locator LIKE 'pdf_page:%'
                AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
              ORDER BY ABS(CAST(substr(c.locator, 10) AS INTEGER) - ?), c.page_no ASC, c.chunk_id ASC
              LIMIT 1
            `
          )
          .bind(chunk.source_code, locatorIndex)
          .first<ReaderChunkRow>();
      }
    }

    if (!targetChunk && chunk.page_no !== null) {
      targetChunk = await db
        .prepare(
          `
            ${readerSelect}
            WHERE s.source_code = ?
              AND c.page_no = ?
              AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
            ORDER BY c.chunk_id ASC
            LIMIT 1
          `
        )
        .bind(chunk.source_code, chunk.page_no)
        .first<ReaderChunkRow>();
    }

    if (targetChunk) chunk = targetChunk;
  }

  if (!chunk) return emptyPayload;

  const safePage = Number.isFinite(Number(chunk.page_no)) ? Number(chunk.page_no) : -1;

  const prev = await db
    .prepare(
      `
        SELECT c.chunk_id, c.page_no
        FROM ar_source_chunks c
        JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
        WHERE s.source_code = ?
          AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
          AND (c.page_no < ? OR (c.page_no = ? AND c.chunk_id < ?))
        ORDER BY c.page_no DESC, c.chunk_id DESC
        LIMIT 1
      `
    )
    .bind(chunk.source_code, safePage, safePage, chunk.chunk_id)
    .first<ReaderNavRow>();

  const next = await db
    .prepare(
      `
        SELECT c.chunk_id, c.page_no
        FROM ar_source_chunks c
        JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
        WHERE s.source_code = ?
          AND COALESCE(json_extract(c.content_json, '$.chunk_scope'), 'page') = 'page'
          AND (c.page_no > ? OR (c.page_no = ? AND c.chunk_id > ?))
        ORDER BY c.page_no ASC, c.chunk_id ASC
        LIMIT 1
      `
    )
    .bind(chunk.source_code, safePage, safePage, chunk.chunk_id)
    .first<ReaderNavRow>();

  return {
    ok: true,
    mode: 'reader' as const,
    chunk: {
      chunk_id: chunk.chunk_id,
      page_no: chunk.page_no,
      page_to: chunk.page_no,
      heading_raw: chunk.heading_raw,
      locator: chunk.locator,
      chunk_type: chunk.chunk_type,
      text: chunk.text,
      source_code: chunk.source_code,
      source_title: chunk.source_title,
      reader_scope: 'page' as const,
      toc_id: null,
    },
    nav: {
      prev_chunk_id: prev?.chunk_id ?? null,
      prev_page_no: prev?.page_no ?? null,
      next_chunk_id: next?.chunk_id ?? null,
      next_page_no: next?.page_no ?? null,
      prev_toc_id: null,
      next_toc_id: null,
    },
  };
}

async function syncChunkFts(db: D1Database, chunkId: string) {
  const chunk = await db
    .prepare(
      `
        SELECT
          c.chunk_id,
          c.heading_norm,
          c.text_search,
          s.source_code
        FROM ar_source_chunks c
        JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
        WHERE c.chunk_id = ?
        LIMIT 1
      `
    )
    .bind(chunkId)
    .first<{
      chunk_id: string;
      heading_norm: string | null;
      text_search: string;
      source_code: string;
    }>();

  if (!chunk) return;

  await db.prepare(`DELETE FROM ar_source_chunks_fts WHERE chunk_id = ?`).bind(chunkId).run();
  await db
    .prepare(
      `
        INSERT INTO ar_source_chunks_fts (chunk_id, source_code, heading_norm, text_search)
        VALUES (?, ?, ?, ?)
      `
    )
    .bind(chunk.chunk_id, chunk.source_code, chunk.heading_norm ?? '', chunk.text_search ?? '')
    .run();
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const user = await requireAuth(ctx);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const url = new URL(ctx.request.url);
  const mode = normalizeMode(url.searchParams.get('mode'));
  const q = (url.searchParams.get('q') ?? '').trim();
  const sourceCode = (url.searchParams.get('source_code') ?? '').trim();
  const chunkType = normalizeChunkType(url.searchParams.get('chunk_type'));
  const headingNormRaw = (url.searchParams.get('heading_norm') ?? '').trim();
  const arULexicon = (url.searchParams.get('ar_u_lexicon') ?? '').trim();
  const chunkId = (url.searchParams.get('chunk_id') ?? '').trim();
  const tocId = (url.searchParams.get('toc_id') ?? '').trim();
  const pageNoRaw = (url.searchParams.get('page_no') ?? '').trim();
  const pageNo = pageNoRaw ? toInt(pageNoRaw, Number.NaN) : null;

  const maxLimit = mode === 'pages' || mode === 'toc' || mode === 'index' ? 5000 : 200;
  const limit = Math.min(maxLimit, Math.max(1, toInt(url.searchParams.get('limit'), 50)));
  const offset = Math.max(0, toInt(url.searchParams.get('offset'), 0));
  const pageFromRaw = (url.searchParams.get('page_from') ?? '').trim();
  const pageToRaw = (url.searchParams.get('page_to') ?? '').trim();
  const pageFrom = pageFromRaw ? toInt(pageFromRaw, Number.NaN) : null;
  const pageTo = pageToRaw ? toInt(pageToRaw, Number.NaN) : null;

  if ((pageFromRaw && !Number.isFinite(pageFrom)) || (pageToRaw && !Number.isFinite(pageTo))) {
    return new Response(JSON.stringify({ ok: false, error: 'page_from/page_to must be integers' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  if (pageNoRaw && !Number.isFinite(pageNo)) {
    return new Response(JSON.stringify({ ok: false, error: 'page_no must be an integer' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  if (chunkType && !CHUNK_TYPE_SET.has(chunkType as ChunkType)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'chunk_type must be one of: grammar, literature, lexicon, reference, other',
      }),
      {
        status: 400,
        headers: jsonHeaders,
      }
    );
  }

  try {
    if (mode === 'sources') {
      const payload = await runSourceSearch(ctx.env.DB, q, limit, offset);
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'pages') {
      const payload = await runPageList(
        ctx.env.DB,
        sourceCode,
        headingNormRaw,
        pageFrom,
        pageTo,
        limit,
        offset
      );
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'toc') {
      const payload = await runTocList(
        ctx.env.DB,
        q,
        sourceCode,
        headingNormRaw,
        pageFrom,
        pageTo,
        limit,
        offset
      );
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'index') {
      const payload = await runIndexList(
        ctx.env.DB,
        q,
        sourceCode,
        headingNormRaw,
        pageFrom,
        pageTo,
        limit,
        offset
      );
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'lexicon') {
      return runLexiconEvidence(ctx.env.DB, arULexicon, sourceCode, limit, offset);
    }

    if (mode === 'reader') {
      const payload = await runReaderChunk(ctx.env.DB, chunkId, sourceCode, pageNo, tocId);
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'chunks') {
      const payload = await runChunkSearch(
        ctx.env.DB,
        q,
        sourceCode,
        chunkType,
        headingNormRaw,
        pageFrom,
        pageTo,
        limit,
        offset
      );
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    const payload = await runEvidenceSearch(
      ctx.env.DB,
      q,
      sourceCode,
      arULexicon,
      headingNormRaw,
      pageFrom,
      pageTo,
      limit,
      offset
    );
    return new Response(JSON.stringify(payload), { headers: jsonHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isFtsQueryError =
      message.includes('fts5: syntax error') ||
      message.includes('no such column') ||
      message.includes('malformed MATCH expression');

    if (isFtsQueryError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Invalid full-text query in q. Use plain tokens or valid FTS5 syntax.',
          detail: message,
        }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      );
    }

    console.error('book search error', err);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to run book search', detail: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  const user = await requireAuth(ctx);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const chunkId = String(body.chunk_id ?? '').trim();
  if (!chunkId) {
    return new Response(JSON.stringify({ ok: false, error: 'chunk_id is required' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const exists = await ctx.env.DB
    .prepare(`SELECT 1 AS ok FROM ar_source_chunks WHERE chunk_id = ? LIMIT 1`)
    .bind(chunkId)
    .first<{ ok: 1 }>();
  if (!exists) {
    return new Response(JSON.stringify({ ok: false, error: 'Chunk not found' }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  const updates: string[] = [];
  const binds: SqlBind[] = [];

  let headingWasUpdated = false;
  let textWasUpdated = false;
  let textSearchWasUpdated = false;

  if (Object.prototype.hasOwnProperty.call(body, 'page_no')) {
    const raw = body.page_no;
    if (raw === null || raw === '') {
      updates.push(`page_no = NULL`);
    } else {
      const num = Number.parseInt(String(raw), 10);
      if (!Number.isFinite(num)) {
        return new Response(JSON.stringify({ ok: false, error: 'page_no must be an integer or null' }), {
          status: 400,
          headers: jsonHeaders,
        });
      }
      updates.push(`page_no = ?`);
      binds.push(num);
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'heading_raw')) {
    const headingRaw = body.heading_raw === null ? null : String(body.heading_raw ?? '').trim();
    updates.push(`heading_raw = ?`);
    binds.push(headingRaw);
    headingWasUpdated = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'heading_norm')) {
    const headingNorm = body.heading_norm === null ? null : normalizeHeading(String(body.heading_norm ?? ''));
    updates.push(`heading_norm = ?`);
    binds.push(headingNorm);
    headingWasUpdated = true;
  } else if (Object.prototype.hasOwnProperty.call(body, 'heading_raw')) {
    const headingRaw = body.heading_raw === null ? '' : String(body.heading_raw ?? '');
    updates.push(`heading_norm = ?`);
    binds.push(normalizeHeading(headingRaw));
    headingWasUpdated = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'locator')) {
    const locator = body.locator === null ? null : String(body.locator ?? '').trim();
    updates.push(`locator = ?`);
    binds.push(locator);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'chunk_type')) {
    const rawChunkType = body.chunk_type;
    const normalizedChunkType = rawChunkType === null ? null : normalizeChunkType(String(rawChunkType));
    if (normalizedChunkType !== null && normalizedChunkType !== '' && !CHUNK_TYPE_SET.has(normalizedChunkType as ChunkType)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'chunk_type must be one of: grammar, literature, lexicon, reference, other',
        }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      );
    }
    updates.push(`chunk_type = ?`);
    binds.push(normalizedChunkType && normalizedChunkType !== '' ? normalizedChunkType : null);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'text')) {
    const text = String(body.text ?? '');
    updates.push(`text = ?`);
    binds.push(text);
    updates.push(`text_search = ?`);
    binds.push(normalizeSearchText(text));
    textWasUpdated = true;
    textSearchWasUpdated = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'text_search')) {
    const textSearch = normalizeSearchText(String(body.text_search ?? ''));
    updates.push(`text_search = ?`);
    binds.push(textSearch);
    textSearchWasUpdated = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'content_json')) {
    const raw = body.content_json;
    if (raw === null) {
      updates.push(`content_json = NULL`);
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        updates.push(`content_json = NULL`);
      } else {
        try {
          JSON.parse(trimmed);
        } catch {
          return new Response(JSON.stringify({ ok: false, error: 'content_json string must be valid JSON' }), {
            status: 400,
            headers: jsonHeaders,
          });
        }
        updates.push(`content_json = json(?)`);
        binds.push(trimmed);
      }
    } else {
      updates.push(`content_json = json(?)`);
      binds.push(JSON.stringify(raw));
    }
  }

  if (!updates.length) {
    return new Response(JSON.stringify({ ok: false, error: 'No editable fields supplied' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  updates.push(`updated_at = datetime('now')`);

  await ctx.env.DB
    .prepare(
      `
        UPDATE ar_source_chunks
        SET ${updates.join(', ')}
        WHERE chunk_id = ?
      `
    )
    .bind(...binds, chunkId)
    .run();

  if (textWasUpdated || headingWasUpdated || textSearchWasUpdated) {
    await syncChunkFts(ctx.env.DB, chunkId);
  }

  const readerPayload = await runReaderChunk(ctx.env.DB, chunkId, '', null, '');
  return new Response(
    JSON.stringify({
      ok: true,
      saved: true,
      chunk: readerPayload.chunk,
      nav: readerPayload.nav,
    }),
    { headers: jsonHeaders }
  );
};
