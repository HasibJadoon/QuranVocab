import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeJson(value: unknown) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
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
  const surah = Number.parseInt(String(url.searchParams.get('surah') ?? ''), 10);
  if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
    return new Response(JSON.stringify({ ok: false, error: 'surah query param is required (1-114).' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const page = Math.max(1, toInt(url.searchParams.get('page'), 1));
  const pageSize = Math.min(500, Math.max(25, toInt(url.searchParams.get('pageSize'), 300)));
  let limit = pageSize;
  let offset = (page - 1) * pageSize;
  const offsetParam = url.searchParams.get('offset');
  const limitParam = url.searchParams.get('limit');
  if (offsetParam !== null || limitParam !== null) {
    limit = Math.min(500, Math.max(1, toInt(limitParam, pageSize)));
    offset = Math.max(0, toInt(offsetParam, 0));
  }

  try {
    const countStmt = ctx.env.DB.prepare(`SELECT COUNT(*) AS total FROM ar_quran_ayah WHERE surah = ?1`).bind(surah);
    const countRes = await countStmt.first();
    const total = Number(countRes?.total ?? 0);

    const dataStmt = ctx.env.DB.prepare(`
      SELECT
        id,
        surah,
        ayah,
        surah_ayah,
        page,
        juz,
        hizb,
        ruku,
        text,
        text_simple,
        text_normalized,
        verse_mark,
        verse_full,
        word_count,
        char_count,
        surah_name_ar,
        surah_name_en
      FROM ar_quran_ayah
      WHERE surah = ?1
      ORDER BY ayah ASC
      LIMIT ?2
      OFFSET ?3
    `);

    const { results = [] } = await dataStmt.bind(surah, limit, offset).all();

    const ayahList = (results as any[]).map((row) => row.ayah).filter((value) => Number.isFinite(value));
    const lemmaMap = new Map<number, any[]>();
    const translationMap = new Map<number, any>();
    if (ayahList.length) {
      const chunkSize = 80;
      for (let i = 0; i < ayahList.length; i += chunkSize) {
        const chunk = ayahList.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(', ');
        const lemmaStmt = ctx.env.DB.prepare(
          `
          SELECT
            loc.id,
            loc.surah,
            loc.ayah,
            loc.word_location,
            loc.token_index,
            loc.ar_token_occ_id,
            loc.ar_u_token,
            loc.word_simple,
            loc.word_diacritic,
            l.lemma_id,
            l.lemma_text,
            l.lemma_text_clean,
            l.words_count,
            l.uniq_words_count
          FROM quran_ayah_lemma_location loc
          JOIN quran_ayah_lemmas l ON l.lemma_id = loc.lemma_id
          WHERE loc.surah = ?1 AND loc.ayah IN (${placeholders})
          ORDER BY loc.ayah ASC, loc.token_index ASC, l.lemma_text ASC
        `
        );
        const lemmaRows = (await lemmaStmt.bind(surah, ...chunk).all()) as { results?: any[] };
        for (const row of lemmaRows?.results ?? []) {
          const bucket = lemmaMap.get(row.ayah) ?? [];
          bucket.push(row);
          lemmaMap.set(row.ayah, bucket);
        }

        const translationStmt = ctx.env.DB.prepare(
          `
          SELECT
            surah,
            ayah,
            translation_haleem,
            translation_asad,
            translation_sahih,
            translation_usmani,
            footnotes_sahih,
            footnotes_usmani,
            meta_json
          FROM ar_quran_translations
          WHERE surah = ?1 AND ayah IN (${placeholders})
          ORDER BY ayah ASC
        `
        );
        const translationRows = (await translationStmt.bind(surah, ...chunk).all()) as { results?: any[] };
        for (const row of translationRows?.results ?? []) {
          translationMap.set(row.ayah, row);
        }
      }
    }

    const enriched = (results as any[]).map((row) => {
      const lemmas = lemmaMap.get(row.ayah) ?? [];
      const translationsRow = translationMap.get(row.ayah) ?? null;
      const translations = translationsRow
        ? {
            haleem: translationsRow.translation_haleem ?? null,
            asad: translationsRow.translation_asad ?? null,
            sahih: translationsRow.translation_sahih ?? null,
            usmani: translationsRow.translation_usmani ?? null,
            footnotes_sahih: translationsRow.footnotes_sahih ?? null,
            footnotes_usmani: translationsRow.footnotes_usmani ?? null,
            meta: safeJson(translationsRow.meta_json),
          }
        : null;
      const translation =
        translationsRow?.translation_haleem ??
        translationsRow?.translation_asad ??
        translationsRow?.translation_sahih ??
        translationsRow?.translation_usmani ??
        null;
      const words = lemmas.map((lemma) => ({
        id: lemma.id,
        position: lemma.token_index,
        location: lemma.word_location,
        text_uthmani: lemma.word_diacritic ?? null,
        text_imlaei_simple: lemma.word_simple ?? null,
        lemma_id: lemma.lemma_id,
        lemma_text: lemma.lemma_text,
        lemma_text_clean: lemma.lemma_text_clean,
        words_count: lemma.words_count ?? null,
        uniq_words_count: lemma.uniq_words_count ?? null,
        word_simple: lemma.word_simple ?? null,
        word_diacritic: lemma.word_diacritic ?? null,
        ar_u_token: lemma.ar_u_token ?? null,
        ar_token_occ_id: lemma.ar_token_occ_id ?? null,
      }));
      return {
        ...row,
        verse_key: `${row.surah}:${row.ayah}`,
        verse_number: row.ayah,
        chapter_id: row.surah,
        text_uthmani: row.text,
        text_imlaei_simple: row.text_simple ?? null,
        page_number: row.page ?? null,
        juz_number: row.juz ?? null,
        hizb_number: row.hizb ?? null,
        ruku_number: row.ruku ?? null,
        translation,
        translations,
        lemmas,
        words,
      };
    });

    return new Response(
      JSON.stringify({
        ok: true,
        total,
        page,
        pageSize: limit,
        results: enriched,
        verses: enriched,
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error('ayah list error', err);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to load ayahs' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
