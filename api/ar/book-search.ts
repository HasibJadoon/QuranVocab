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

type SearchMode = 'sources' | 'chunks' | 'evidence' | 'lexicon';

type SqlBind = string | number;

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

function normalizeMode(value: string | null): SearchMode {
  const mode = (value ?? 'chunks').trim().toLowerCase();
  if (mode === 'sources' || mode === 'chunks' || mode === 'evidence' || mode === 'lexicon') {
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
  hit: string | null;
  rank: number | null;
};

type EvidenceRow = {
  ar_u_lexicon: string;
  chunk_id: string;
  source_code: string;
  page_no: number | null;
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
  if (pageFrom !== null) {
    whereParts.push('c.page_no >= ?');
    binds.push(pageFrom);
  }
  if (pageTo !== null) {
    whereParts.push('c.page_no <= ?');
    binds.push(pageTo);
  }
  if (headingNormRaw) {
    whereParts.push('c.heading_norm = ?');
    binds.push(normalizeHeading(headingNormRaw));
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
      page_from: pageFrom,
      page_to: pageTo,
      heading_norm: headingNormRaw ? normalizeHeading(headingNormRaw) : null,
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
      e.link_role,
      ${hitExpr}
    FROM ar_u_lexicon_evidence_fts ef
    JOIN ar_u_lexicon_evidence e
      ON e.chunk_id = ef.chunk_id
     AND e.ar_u_lexicon = ef.ar_u_lexicon
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
  const headingNormRaw = (url.searchParams.get('heading_norm') ?? '').trim();
  const arULexicon = (url.searchParams.get('ar_u_lexicon') ?? '').trim();

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

  try {
    if (mode === 'sources') {
      const payload = await runSourceSearch(ctx.env.DB, q, limit, offset);
      return new Response(JSON.stringify(payload), { headers: jsonHeaders });
    }

    if (mode === 'lexicon') {
      return runLexiconEvidence(ctx.env.DB, arULexicon, sourceCode, limit, offset);
    }

    if (mode === 'chunks') {
      const payload = await runChunkSearch(
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

    const payload = await runEvidenceSearch(
      ctx.env.DB,
      q,
      sourceCode,
      arULexicon,
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
