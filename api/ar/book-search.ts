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

type SearchMode = 'sources' | 'pages' | 'chunks' | 'evidence' | 'lexicon' | 'reader';
type ChunkType = 'grammar' | 'literature' | 'lexicon' | 'reference' | 'other';

type SqlBind = string | number;
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

type EvidenceRow = {
  ar_u_lexicon: string;
  chunk_id: string;
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
  chunk_id: string;
  page_no: number | null;
  extract_text: string | null;
  notes: string | null;
};

type ReaderChunkRow = {
  chunk_id: string;
  page_no: number | null;
  heading_raw: string | null;
  locator: string | null;
  text: string;
  source_code: string;
  source_title: string;
};

type ReaderNavRow = {
  chunk_id: string;
  page_no: number | null;
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
    LEFT JOIN ar_source_chunks c ON c.ar_u_source = s.ar_u_source
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
    whereParts.push('c.heading_norm LIKE ?');
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
      ON e.chunk_id = ef.chunk_id
     AND e.ar_u_lexicon = ef.ar_u_lexicon
    JOIN ar_source_chunks c
      ON c.chunk_id = e.chunk_id
    ${whereClause}
  `;

  const countRow = await db
    .prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const hitExpr = q
    ? `snippet(ar_u_lexicon_evidence_fts, 3, '[', ']', '…', 12) AS extract_hit,
       snippet(ar_u_lexicon_evidence_fts, 4, '[', ']', '…', 12) AS notes_hit,
       bm25(ar_u_lexicon_evidence_fts) AS rank`
    : `substr(COALESCE(e.extract_text, ''), 1, 260) AS extract_hit,
       substr(COALESCE(e.notes, ''), 1, 260) AS notes_hit,
       NULL AS rank`;
  const orderBy = q ? 'ORDER BY rank ASC, e.page_no ASC, e.chunk_id ASC' : 'ORDER BY e.page_no ASC, e.chunk_id ASC';

  const dataSql = `
    SELECT
      e.ar_u_lexicon,
      e.chunk_id,
      ef.source_code,
      e.page_no,
      c.heading_raw,
      c.heading_norm,
      e.link_role,
      ${hitExpr}
    FROM ar_u_lexicon_evidence_fts ef
    JOIN ar_u_lexicon_evidence e
      ON e.chunk_id = ef.chunk_id
     AND e.ar_u_lexicon = ef.ar_u_lexicon
    JOIN ar_source_chunks c
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
    JOIN ar_u_sources s ON s.ar_u_source = e.ar_u_source
    ${whereClause}
  `;
  const countRow = await db.prepare(countSql).bind(...binds).first<{ total: number }>();
  const total = Number(countRow?.total ?? 0);

  const dataSql = `
    SELECT
      s.source_code,
      s.title,
      e.chunk_id,
      e.page_no,
      e.extract_text,
      e.notes
    FROM ar_u_lexicon_evidence e
    JOIN ar_u_sources s ON s.ar_u_source = e.ar_u_source
    ${whereClause}
    ORDER BY s.source_code ASC, e.page_no ASC, e.chunk_id ASC
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
  pageNo: number | null
) {
  let chunk: ReaderChunkRow | null = null;

  if (chunkId) {
    chunk = await db
      .prepare(
        `
          SELECT
            c.chunk_id,
            c.page_no,
            c.heading_raw,
            c.locator,
            c.text,
            s.source_code,
            s.title AS source_title
          FROM ar_source_chunks c
          JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
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
          SELECT
            c.chunk_id,
            c.page_no,
            c.heading_raw,
            c.locator,
            c.text,
            s.source_code,
            s.title AS source_title
          FROM ar_source_chunks c
          JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
          WHERE s.source_code = ?
            AND c.page_no = ?
          ORDER BY c.chunk_id ASC
          LIMIT 1
        `
      )
      .bind(sourceCode, pageNo)
      .first<ReaderChunkRow>();
  }

  if (!chunk) {
    return {
      ok: true,
      mode: 'reader' as const,
      chunk: null,
      nav: {
        prev_chunk_id: null,
        prev_page_no: null,
        next_chunk_id: null,
        next_page_no: null,
      },
    };
  }

  const safePage = Number.isFinite(Number(chunk.page_no)) ? Number(chunk.page_no) : -1;

  const prev = await db
    .prepare(
      `
        SELECT c.chunk_id, c.page_no
        FROM ar_source_chunks c
        JOIN ar_u_sources s ON s.ar_u_source = c.ar_u_source
        WHERE s.source_code = ?
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
    chunk,
    nav: {
      prev_chunk_id: prev?.chunk_id ?? null,
      prev_page_no: prev?.page_no ?? null,
      next_chunk_id: next?.chunk_id ?? null,
      next_page_no: next?.page_no ?? null,
    },
  };
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
  const pageNoRaw = (url.searchParams.get('page_no') ?? '').trim();
  const pageNo = pageNoRaw ? toInt(pageNoRaw, Number.NaN) : null;

  const limit = Math.min(200, Math.max(1, toInt(url.searchParams.get('limit'), 50)));
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

    if (mode === 'lexicon') {
      return runLexiconEvidence(ctx.env.DB, arULexicon, sourceCode, limit, offset);
    }

    if (mode === 'reader') {
      const payload = await runReaderChunk(ctx.env.DB, chunkId, sourceCode, pageNo);
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
