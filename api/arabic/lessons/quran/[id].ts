import { requireAuth } from '../../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const jsonHeaders: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeLessonJson(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};
  if (Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function toInt(v: unknown, def: number | null = null) {
  if (typeof v !== 'number') return def;
  if (!Number.isFinite(v)) return def;
  return Math.trunc(v);
}

function normLower(v: unknown, def: string) {
  const s = typeof v === 'string' ? v.trim() : '';
  return (s || def).toLowerCase();
}

function normStr(v: unknown) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}

interface LessonUnitRow {
  container_id: string | null;
  unit_id: string | null;
  link_scope: string | null;
  order_index: number | null;
  role: string | null;
  unit_type: string | null;
  ayah_from: number | null;
  ayah_to: number | null;
  start_ref: string | null;
  end_ref: string | null;
  meta_json: string | null;
}

interface QuranVerseRow {
  surah: number;
  ayah: number;
  text?: string;
  text_diacritics?: string;
  text_non_diacritics?: string;
  text_simple?: string;
}

type QuranTextPayload = {
  text: {
    mode: 'original';
    arabic_full: Array<{
      unit_id: string;
      unit_type: 'ayah';
      arabic: string;
      arabic_diacritics?: string | null;
      arabic_non_diacritics?: string | null;
      translation: null;
      surah: number;
      ayah: number;
      notes: string | null;
    }>;
  };
  reference: {
    source_type: string;
    source_ref_id: string;
    surah: number;
    ayah_from: number;
    ayah_to: number;
    ref_label: string | null;
    citation: string | null;
  } | null;
};

function parseSurahFromUnitId(unitId: string | null): number | null {
  if (!unitId) return null;
  const parts = unitId.split(':');
  if (parts.length < 3) return null;
  const surah = Number.parseInt(parts[2], 10);
  return Number.isFinite(surah) ? surah : null;
}

function parseSurahFromRef(ref: string | null): number | null {
  if (!ref) return null;
  const parts = ref.split(':');
  if (!parts.length) return null;
  const surah = Number.parseInt(parts[0], 10);
  return Number.isFinite(surah) ? surah : null;
}

function parseAyahFromRef(ref: string | null): number | null {
  if (!ref) return null;
  const parts = ref.split(':');
  if (parts.length < 2) return null;
  const ayahRaw = parts[1].replace(/[^\d]/g, '');
  const ayah = Number.parseInt(ayahRaw, 10);
  return Number.isFinite(ayah) ? ayah : null;
}

function parseMetaLabel(metaJson: string | null): string | null {
  if (!metaJson) return null;
  try {
    const parsed = JSON.parse(metaJson);
    if (parsed && typeof parsed === 'object' && typeof parsed.label === 'string' && parsed.label.trim()) {
      return parsed.label.trim();
    }
  } catch {
    // ignore invalid meta
  }
  return null;
}

async function buildQuranTextPayload(db: D1Database, lessonId: number): Promise<QuranTextPayload> {
  const unitStmt = db
    .prepare(
      `
      SELECT
        l.container_id,
        l.unit_id,
        l.link_scope,
        l.order_index,
        l.role,
        c.unit_type,
        c.ayah_from,
        c.ayah_to,
        c.start_ref,
        c.end_ref,
        c.meta_json
      FROM ar_lesson_unit_link l
      LEFT JOIN ar_container_units c ON c.id = l.unit_id
      WHERE l.lesson_id = ?1
      ORDER BY l.order_index ASC
    `
    )
    .bind(lessonId);

  const unitRes = (await unitStmt.all()) as { results?: LessonUnitRow[] };
  const unitRows = unitRes?.results ?? [];

  const ayahUnits: Array<LessonUnitRow & { __surah?: number; __ayahFrom?: number; __ayahTo?: number }> =
    unitRows
      .filter((row) => row?.unit_type === 'ayah' && typeof row.unit_id === 'string')
      .map((row) => ({ ...row }));

  const verseRequests = new Map<number, Set<number>>();
  const processedUnits: typeof ayahUnits = [];

  for (const unit of ayahUnits) {
    const surah =
      parseSurahFromUnitId(unit.unit_id) ??
      parseSurahFromRef(unit.start_ref) ??
      parseSurahFromRef(unit.end_ref);

    const ayahFrom =
      typeof unit.ayah_from === 'number'
        ? Math.trunc(unit.ayah_from)
        : parseAyahFromRef(unit.start_ref);

    const ayahTo =
      typeof unit.ayah_to === 'number'
        ? Math.trunc(unit.ayah_to)
        : parseAyahFromRef(unit.end_ref ?? unit.start_ref);

    if (surah == null || ayahFrom == null || Number.isNaN(ayahFrom)) {
      continue;
    }
    const maxAyah = ayahTo != null && !Number.isNaN(ayahTo) ? ayahTo : ayahFrom;
    unit.__surah = surah;
    unit.__ayahFrom = ayahFrom;
    unit.__ayahTo = maxAyah;
    processedUnits.push(unit);

    const set = verseRequests.get(surah) ?? new Set<number>();
    verseRequests.set(surah, set);
    for (let ayah = ayahFrom; ayah <= maxAyah; ayah += 1) {
      set.add(ayah);
    }
  }

  const verseMap = new Map<string, QuranVerseRow>();
  for (const [surah, ayahSet] of verseRequests.entries()) {
    const ayahList = Array.from(ayahSet).sort((a, b) => a - b);
    if (!ayahList.length) continue;
    const placeholders = ayahList.map(() => '?').join(', ');
    const verseStmt = db
      .prepare(
        `
        SELECT surah, ayah, text, text_diacritics, text_non_diacritics, text_simple
        FROM ar_quran_ayah
        WHERE surah = ?1 AND ayah IN (${placeholders})
      `
      )
      .bind(surah, ...ayahList);
    const verseRes = (await verseStmt.all()) as { results?: QuranVerseRow[] };
    const verses = verseRes?.results ?? [];
    for (const verse of verses) {
      verseMap.set(`${verse.surah}:${verse.ayah}`, verse);
    }
  }

  const sortedUnits = [...processedUnits].sort((a, b) => {
    const aOrder = typeof a.order_index === 'number' ? a.order_index : 0;
    const bOrder = typeof b.order_index === 'number' ? b.order_index : 0;
    return aOrder - bOrder;
  });

  const arabicUnits: QuranTextPayload['text']['arabic_full'] = [];
  for (const unit of sortedUnits) {
    const surah = unit.__surah ?? parseSurahFromUnitId(unit.unit_id);
    if (surah == null) continue;
    const notes = parseMetaLabel(unit.meta_json);
    const start = unit.__ayahFrom ?? 0;
    const end = unit.__ayahTo ?? start;
    for (let ayah = start; ayah <= end; ayah += 1) {
      const key = `${surah}:${ayah}`;
      const verse = verseMap.get(key);
    const diacText = verse?.text ?? verse?.text_diacritics ?? verse?.text_simple ?? '';
    const cleanText =
      verse?.text_non_diacritics ?? verse?.text_simple ?? verse?.text ?? verse?.text_diacritics ?? '';
    arabicUnits.push({
      unit_id: unit.unit_id ?? key,
      unit_type: 'ayah',
      arabic: cleanText,
      arabic_diacritics: diacText,
      arabic_non_diacritics: cleanText,
      translation: null,
      surah,
      ayah,
      notes,
    });
    }
  }

  const surahNumbers = Array.from(new Set(arabicUnits.map((unit) => unit.surah)));
  const ayahNumbers = arabicUnits.map((unit) => unit.ayah);
  const ayahFrom = ayahNumbers.length ? Math.min(...ayahNumbers) : null;
  const ayahTo = ayahNumbers.length ? Math.max(...ayahNumbers) : null;
  const uniqueSurah = surahNumbers.length === 1 ? surahNumbers[0] : null;

  let surahName: string | null = null;
  if (uniqueSurah != null) {
    const surahRow = (await db
      .prepare('SELECT name_ar, name_en FROM ar_surahs WHERE surah = ?1')
      .bind(uniqueSurah)
      .first<any>()) ?? null;
    surahName = surahRow?.name_en ?? surahRow?.name_ar ?? null;
  }

  const rangeLabel =
    ayahFrom != null
      ? ayahTo != null && ayahTo !== ayahFrom
        ? `${ayahFrom}-${ayahTo}`
        : `${ayahFrom}`
      : ayahTo != null
      ? `${ayahTo}`
      : '';

  const labelParts: string[] = [];
  if (surahName) {
    labelParts.push(surahName);
  }
  if (uniqueSurah != null) {
    const surahLabel = `Surah ${uniqueSurah}${rangeLabel ? `:${rangeLabel}` : ''}`;
    labelParts.push(surahLabel);
  }

  const refLabel = labelParts.length ? labelParts.join(' ') : null;
  const sourceRefId =
    uniqueSurah != null
      ? rangeLabel
        ? `${uniqueSurah}:${rangeLabel}`
        : `${uniqueSurah}`
      : '';

  return {
    text: {
      mode: 'original',
      arabic_full: arabicUnits,
    },
    reference:
      uniqueSurah != null
        ? {
            source_type: 'quran',
            source_ref_id: sourceRefId,
            surah: uniqueSurah,
            ayah_from: ayahFrom ?? undefined,
            ayah_to: ayahTo ?? undefined,
            ref_label: refLabel,
            citation: refLabel,
          }
        : null,
  };
}

/* ========================= GET /arabic/lessons/quran/:id ========================= */

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const id = Number(ctx.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid id' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const row = await ctx.env.DB
      .prepare(
        `
        SELECT
          id, user_id, title, title_ar, lesson_type, subtype, source, status, difficulty,
          created_at, updated_at, lesson_json
        FROM ar_lessons
        WHERE id = ?1 AND user_id = ?2 AND lesson_type = 'quran'
        LIMIT 1
        `
      )
      .bind(id, user.id)
      .first<any>();

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const textPayload = await buildQuranTextPayload(ctx.env.DB, id);

    const parsed = safeJsonParse((row.lesson_json as string | null) ?? null);
    const baseJson = parsed ?? {};
    const mergedJson = {
      ...baseJson,
      text: textPayload.text ?? baseJson.text,
      reference: textPayload.reference ?? baseJson.reference ?? null,
    };

    const headers = { ...jsonHeaders, 'x-hit': 'ID /arabic/lessons/quran/:id' };

    return new Response(
      JSON.stringify({ ok: true, result: { ...row, lesson_json: mergedJson } }),
      { headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

/* ========================= PUT /arabic/lessons/quran/:id ========================= */

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'Admin role required' }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    const id = Number(ctx.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid id' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    let body: any;
    try {
      body = await ctx.request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return new Response(JSON.stringify({ ok: false, error: 'Title is required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const title_ar = normStr(body?.title_ar);
    const lesson_type = 'quran';
    const subtype = normStr(body?.subtype);
    const source = normStr(body?.source);
    const status = normLower(body?.status, 'draft');
    const difficulty = toInt(body?.difficulty, null);

    const lessonJsonObj = normalizeLessonJson(body?.lesson_json ?? body?.lessonJson);
    const lesson_json = JSON.stringify(lessonJsonObj ?? {});

    const res = await ctx.env.DB
      .prepare(
        `
        UPDATE ar_lessons
        SET
          title = ?1,
          title_ar = ?2,
          lesson_type = ?3,
          subtype = ?4,
          source = ?5,
          status = ?6,
          difficulty = ?7,
          lesson_json = ?8,
          updated_at = datetime('now')
        WHERE id = ?9 AND user_id = ?10 AND lesson_type = 'quran'
        RETURNING
          id, user_id, title, title_ar, lesson_type, subtype, source, status, difficulty,
          created_at, updated_at, lesson_json
        `
      )
      .bind(title, title_ar, lesson_type, subtype, source, status, difficulty, lesson_json, id, user.id)
      .first<any>();

    if (!res) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const parsed = safeJsonParse((res.lesson_json as string | null) ?? null);

    return new Response(JSON.stringify({ ok: true, result: { ...res, lesson_json: parsed ?? res.lesson_json } }), {
      headers: jsonHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

/* ========================= DELETE /arabic/lessons/quran/:id ========================= */

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'Admin role required' }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    const id = Number(ctx.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid id' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const res = await ctx.env.DB
      .prepare(`DELETE FROM ar_lessons WHERE id = ?1 AND user_id = ?2 AND lesson_type = 'quran' RETURNING id`)
      .bind(id, user.id)
      .first<{ id: number }>();

    if (!res?.id) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true, id: res.id }), { headers: jsonHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
