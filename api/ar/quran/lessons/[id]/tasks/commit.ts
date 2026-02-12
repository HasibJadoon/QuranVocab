import { requireAuth } from '../../../../../_utils/auth';
import {
  canonicalize,
  sha256Hex,
  upsertArUGrammar,
  upsertArULexicon,
  upsertArURoot,
  upsertArUSentence,
  upsertArUSpan,
  upsertArUToken,
} from '../../../../../_utils/universal';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const jsonHeaders: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

const TASK_LABELS: Record<string, string> = {
  sentence_structure: 'Sentence Structure',
  morphology: 'Morphology',
};

const MORPH_POS_MAP: Record<string, string> = {
  اسم: 'noun',
  فعل: 'verb',
  حرف: 'particle',
  صفة: 'adj',
};

const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_TATWEEL_RE = /\u0640/g;
const ARABIC_NON_LETTERS_RE = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;

type CommitBody = {
  container_id?: string | null;
  unit_id?: string | null;
  task_type?: string;
  task_json?: unknown;
};

type SentenceItem = {
  sentence_order?: number;
  canonical_sentence?: string;
  ar_u_sentence?: string;
  steps?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type GrammarRef = {
  grammarId?: string;
  arUGrammar?: string;
  record?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
  return items.length ? items : null;
}

function normalizeArabic(input: string): string {
  return input.normalize('NFKC').replace(ARABIC_DIACRITICS_RE, '').trim();
}

function normalizePos(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (['verb', 'noun', 'adj', 'particle', 'phrase'].includes(lower)) return lower;
  return MORPH_POS_MAP[trimmed] ?? null;
}

function normalizeRootValue(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = normalizeArabic(raw).replace(/\s+/g, '');
  return cleaned || null;
}

function normalizeSynonymWord(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .normalize('NFKC')
    .replace(ARABIC_DIACRITICS_RE, '')
    .replace(ARABIC_TATWEEL_RE, '')
    .replace(ARABIC_NON_LETTERS_RE, '')
    .trim();
  return cleaned || null;
}

function toJsonOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

function parseWordLocationIndex(value: string | null): number | null {
  if (!value) return null;
  const parts = value.split(':').map((entry) => entry.trim());
  const last = Number(parts[parts.length - 1]);
  return Number.isFinite(last) ? last : null;
}

function buildCommitId(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? '')).join('|');
}

function pickFeatureValue(features: Record<string, unknown> | null, key: string): string | null {
  if (!features) return null;
  const raw = features[key];
  return typeof raw === 'string' ? raw.trim() || null : null;
}

function extractTokenMorph(pos: string, features: Record<string, unknown> | null) {
  if (!features) return null;

  let nounCase: string | null = null;
  let nounNumber: string | null = null;
  let nounGender: string | null = null;
  let nounDefiniteness: string | null = null;
  let verbTense: string | null = null;
  let verbMood: string | null = null;
  let verbVoice: string | null = null;
  let verbPerson: string | null = null;
  let verbNumber: string | null = null;
  let verbGender: string | null = null;
  let particleType: string | null = null;

  if (pos === 'noun' || pos === 'adj') {
    nounCase = pickFeatureValue(features, 'status');
    nounNumber = pickFeatureValue(features, 'number');
    nounGender = pickFeatureValue(features, 'gender');
    nounDefiniteness = pickFeatureValue(features, 'type');
  } else if (pos === 'verb') {
    verbTense = pickFeatureValue(features, 'tense');
    verbMood = pickFeatureValue(features, 'mood');
    verbVoice = pickFeatureValue(features, 'voice');
    verbPerson = pickFeatureValue(features, 'person');
    verbNumber = pickFeatureValue(features, 'number');
    verbGender = pickFeatureValue(features, 'gender');
  } else if (pos === 'particle') {
    particleType = pickFeatureValue(features, 'particle_type');
  }

  const hasValues = [
    nounCase,
    nounNumber,
    nounGender,
    nounDefiniteness,
    verbTense,
    verbMood,
    verbVoice,
    verbPerson,
    verbNumber,
    verbGender,
    particleType,
  ].some(Boolean);

  if (!hasValues) return null;

  return {
    pos,
    nounCase,
    nounNumber,
    nounGender,
    nounDefiniteness,
    verbTense,
    verbMood,
    verbVoice,
    verbPerson,
    verbNumber,
    verbGender,
    particleType,
  };
}

function isLikelyHexId(value: string | null): boolean {
  if (!value) return false;
  return /^[a-f0-9]{64}$/i.test(value);
}

async function upsertTokenMorph(
  db: D1Database,
  tokenOccId: string,
  pos: string,
  features: Record<string, unknown> | null
) {
  const morph = extractTokenMorph(pos, features);
  if (!morph) {
    await db.prepare(`DELETE FROM ar_occ_token_morph WHERE ar_token_occ_id = ?1`).bind(tokenOccId).run();
    return;
  }

  await db
    .prepare(
      `
      INSERT INTO ar_occ_token_morph (
        ar_token_occ_id,
        pos,
        noun_case,
        noun_number,
        noun_gender,
        noun_definiteness,
        verb_tense,
        verb_mood,
        verb_voice,
        verb_person,
        verb_number,
        verb_gender,
        particle_type,
        extra_json,
        created_at,
        updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6,
        ?7, ?8, ?9, ?10, ?11, ?12,
        ?13, NULL, datetime('now'), datetime('now')
      )
      ON CONFLICT(ar_token_occ_id) DO UPDATE SET
        pos = excluded.pos,
        noun_case = excluded.noun_case,
        noun_number = excluded.noun_number,
        noun_gender = excluded.noun_gender,
        noun_definiteness = excluded.noun_definiteness,
        verb_tense = excluded.verb_tense,
        verb_mood = excluded.verb_mood,
        verb_voice = excluded.verb_voice,
        verb_person = excluded.verb_person,
        verb_number = excluded.verb_number,
        verb_gender = excluded.verb_gender,
        particle_type = excluded.particle_type,
        extra_json = excluded.extra_json,
        updated_at = datetime('now')
    `
    )
    .bind(
      tokenOccId,
      morph.pos,
      morph.nounCase,
      morph.nounNumber,
      morph.nounGender,
      morph.nounDefiniteness,
      morph.verbTense,
      morph.verbMood,
      morph.verbVoice,
      morph.verbPerson,
      morph.verbNumber,
      morph.verbGender,
      morph.particleType
    )
    .run();
}

async function insertTokenLexiconLink(db: D1Database, tokenOccId: string, lexiconId: string) {
  await db
    .prepare(
      `
      INSERT OR IGNORE INTO ar_token_lexicon_link (
        ar_token_occ_id, ar_u_lexicon, created_at
      ) VALUES (?1, ?2, datetime('now'))
    `
    )
    .bind(tokenOccId, lexiconId)
    .run();
}

type SynonymLookup = {
  topicIds: string[];
  entries: Array<Record<string, unknown>>;
};

async function fetchSynonymLookup(
  db: D1Database,
  lemmaNorm: string | null,
  lemmaAr: string | null
): Promise<SynonymLookup> {
  const normalized = normalizeSynonymWord(lemmaNorm) ?? normalizeSynonymWord(lemmaAr);
  if (!normalized) return { topicIds: [], entries: [] };

  const topicRows = await db
    .prepare(
      `
      SELECT DISTINCT topic_id
      FROM ar_quran_synonym_topic_words
      WHERE word_norm = ?1
    `
    )
    .bind(normalized)
    .all<any>();

  const topicIds = (topicRows?.results ?? [])
    .map((row: any) => (row?.topic_id ? String(row.topic_id) : ''))
    .filter(Boolean);
  if (!topicIds.length) return { topicIds: [], entries: [] };

  const placeholders = topicIds.map((_, idx) => `?${idx + 1}`).join(',');
  const entriesRows = await db
    .prepare(
      `
      SELECT topic_id, word_norm, word_ar, word_en, root_norm, root_ar, order_index
      FROM ar_quran_synonym_topic_words
      WHERE topic_id IN (${placeholders})
      ORDER BY topic_id, order_index
    `
    )
    .bind(...topicIds)
    .all<any>();

  const entries = (entriesRows?.results ?? []).map((row: any) => ({
    topic_id: row?.topic_id ?? null,
    word_norm: row?.word_norm ?? null,
    word_ar: row?.word_ar ?? null,
    word_en: row?.word_en ?? null,
    root_norm: row?.root_norm ?? null,
    root_ar: row?.root_ar ?? null,
    order_index: row?.order_index ?? null,
  }));

  return { topicIds, entries };
}

function nextOrder(items: SentenceItem[]): number {
  const orders = items.map((item) => asNumber(item.sentence_order)).filter((n): n is number => n != null);
  if (!orders.length) return 1;
  return Math.max(...orders) + 1;
}

function isLikelyArUGrammar(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

function parseGrammarString(value: string): { grammarId?: string; arUGrammar?: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (isLikelyArUGrammar(trimmed)) return { arUGrammar: trimmed };
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('gram|') || lower.startsWith('grammar|')) {
    const parts = trimmed.split('|');
    const last = parts[parts.length - 1];
    if (last && last !== trimmed) return { grammarId: last };
  }
  return { grammarId: trimmed };
}

function extractGrammarRef(entry: unknown): GrammarRef | null {
  if (typeof entry === 'string') {
    const parsed = parseGrammarString(entry);
    if (parsed.grammarId || parsed.arUGrammar) return { ...parsed };
    return null;
  }
  const record = asRecord(entry);
  if (!record) return null;
  const arUGrammar = asString(record['ar_u_grammar']);
  const grammarId =
    asString(record['grammar_id']) ??
    asString(record['id']) ??
    asString(record['grammar']);
  if (arUGrammar) {
    return { arUGrammar, record };
  }
  if (grammarId) {
    const parsed = parseGrammarString(grammarId);
    if (parsed.grammarId || parsed.arUGrammar) return { ...parsed, record };
  }
  return null;
}

function collectGrammarRefs(list: unknown, out: GrammarRef[]) {
  if (!Array.isArray(list)) return;
  for (const entry of list) {
    const ref = extractGrammarRef(entry);
    if (ref) out.push(ref);
  }
}

function looksLikeStructureSummary(record: Record<string, unknown>): boolean {
  return (
    'sentence_type' in record ||
    'core_pattern' in record ||
    'main_components' in record ||
    'expansions' in record ||
    'grammar_flow' in record
  );
}

function collectGrammarFromSummary(summary: Record<string, unknown> | null, out: GrammarRef[]) {
  if (!summary) return;
  collectGrammarRefs(summary['grammar_flow'], out);
  const main = Array.isArray(summary['main_components']) ? summary['main_components'] : [];
  for (const component of main) {
    const compRecord = asRecord(component);
    if (!compRecord) continue;
    collectGrammarRefs(compRecord['grammar'], out);
  }
  const expansions = Array.isArray(summary['expansions']) ? summary['expansions'] : [];
  for (const expansion of expansions) {
    const expRecord = asRecord(expansion);
    if (!expRecord) continue;
    collectGrammarRefs(expRecord['grammar'], out);
  }
}

function normalizeRoot(raw: string): string {
  return canonicalize(raw).replace(/\s+/g, '');
}

function normalizePos(raw?: string | null, detail?: string | null): 'noun' | 'verb' | 'adj' | 'particle' | 'phrase' {
  const rawTrim = raw?.trim() ?? '';
  const rawLower = rawTrim.toLowerCase();
  if (['noun', 'verb', 'adj', 'particle', 'phrase'].includes(rawLower)) {
    return rawLower as 'noun' | 'verb' | 'adj' | 'particle' | 'phrase';
  }
  const combined = `${rawTrim} ${detail ?? ''}`.toLowerCase();
  if (combined.includes('فعل') || combined.includes('verb')) return 'verb';
  if (combined.includes('صفة') || combined.includes('adj')) return 'adj';
  if (combined.includes('حرف') || combined.includes('particle')) return 'particle';
  return 'noun';
}

function taskJsonObject(taskJson: unknown): Record<string, unknown> | null {
  const record = asRecord(taskJson);
  if (record) return record;
  if (typeof taskJson === 'string') {
    try {
      const parsed = JSON.parse(taskJson);
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
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

    let body: CommitBody;
    try {
      body = await ctx.request.json<CommitBody>();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const taskType = asString(body.task_type);
    if (!taskType || (taskType !== 'sentence_structure' && taskType !== 'morphology')) {
      return new Response(JSON.stringify({ ok: false, error: 'Unsupported task_type.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const lessonRow = await ctx.env.DB
      .prepare(
        `
        SELECT id, user_id, container_id, unit_id
        FROM ar_lessons
        WHERE id = ?1 AND user_id = ?2 AND lesson_type = 'quran'
        LIMIT 1
      `
      )
      .bind(id, user.id)
      .first<any>();

    if (!lessonRow) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const containerId = body.container_id ?? lessonRow.container_id ?? null;
    const unitId = body.unit_id ?? lessonRow.unit_id ?? null;
    if (!containerId || !unitId) {
      return new Response(JSON.stringify({ ok: false, error: 'container_id and unit_id required.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const taskJson = taskJsonObject(body.task_json);
    if (!taskJson) {
      return new Response(JSON.stringify({ ok: false, error: 'task_json must be an object.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (taskType === 'morphology') {
      const rawItems = Array.isArray(taskJson.items) ? taskJson.items : [];
      if (!rawItems.length) {
        return new Response(JSON.stringify({ ok: false, error: 'task_json.items[] is required.' }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      let lexiconUpserted = 0;
      let lexiconSkipped = 0;
      const items: Array<Record<string, unknown>> = [];
      const synonymCache = new Map<string, SynonymLookup>();

      for (const rawItem of rawItems) {
        const item = asRecord(rawItem) ?? {};
        const surfaceAr =
          asString(item['surface_ar']) ??
          asString(item['surface']) ??
          asString(item['text']) ??
          '';
        const surfaceNorm =
          asString(item['surface_norm']) ??
          asString(item['simple']) ??
          normalizeArabic(surfaceAr);
        const lemmaAr =
          asString(item['lemma_ar']) ??
          asString(item['lemma']) ??
          asString(item['lemma_text']) ??
          surfaceAr;
        const lemmaNorm =
          asString(item['lemma_norm']) ??
          asString(item['lemma_text_clean']) ??
          normalizeArabic(lemmaAr || surfaceAr);
        const rootRaw = asString(item['root_ar']) ?? asString(item['root']) ?? null;
        const rootNorm = normalizeRootValue(asString(item['root_norm']) ?? rootRaw);
        const pos = normalizePos(asString(item['pos']));
        const morphology = asRecord(item['morphology']);
        const singular = asRecord(morphology?.['singular']);
        const plural = asRecord(morphology?.['plural']);
        const morphPattern =
          asString(item['morph_pattern']) ??
          asString(item['pattern']) ??
          asString(singular?.['pattern']) ??
          asString(plural?.['pattern']);
        const morphFeatures =
          asRecord(item['morph_features']) ??
          asRecord(item['features']) ??
          asRecord(morphology?.['morph_features']);
        const morphDerivationsRaw = Array.isArray(item['morph_derivations'])
          ? item['morph_derivations']
          : Array.isArray(item['derivations'])
            ? item['derivations']
            : null;
        const morphDerivations =
          morphDerivationsRaw ??
          [
            ...(singular ? [{ kind: 'singular', ...singular }] : []),
            ...(plural ? [{ kind: 'plural', ...plural }] : []),
          ].filter((entry) => Object.keys(entry).length);
        const translationRecord = asRecord(item['translation']);
        const translationPrimary =
          asString(translationRecord?.['primary']) ??
          asString(item['translation']) ??
          asString(item['gloss']) ??
          null;
        const translationAlternatives = asStringArray(translationRecord?.['alternatives']);
        let translationNotes: string | null = null;
        if (translationRecord) {
          const { primary, alternatives, ...rest } = translationRecord as Record<string, unknown>;
          const restKeys = Object.keys(rest);
          if (restKeys.length) {
            try {
              translationNotes = JSON.stringify(rest);
            } catch {
              translationNotes = null;
            }
          }
        }
        const wordLocation = asString(item['word_location']);
        const tokenIndex =
          asNumber(item['token_index']) ??
          parseWordLocationIndex(wordLocation) ??
          null;

        const lexiconRaw =
          asString(item['lexicon_id']) ??
          asString(item['ar_u_lexicon']) ??
          null;
        let lexiconId = isLikelyHexId(lexiconRaw) ? lexiconRaw : null;

        let arURoot: string | null =
          asString(item['ar_u_root']) ?? asString(item['u_root_id']) ?? null;

        if (!arURoot && rootNorm) {
          const rootRow = await upsertArURoot(
            { DB: ctx.env.DB },
            {
              root: rootRaw ?? rootNorm,
              rootNorm,
              meta: { source: 'morphology-task' },
            }
          );
          arURoot = rootRow.ar_u_root;
        }

        let synonymTopicIds: string[] = [];
        let synonymEntries: Array<Record<string, unknown>> = [];
        const synonymKey = normalizeSynonymWord(lemmaNorm) ?? normalizeSynonymWord(lemmaAr);
        if (synonymKey) {
          const cached = synonymCache.get(synonymKey);
          const lookup = cached ?? (await fetchSynonymLookup(ctx.env.DB, lemmaNorm, lemmaAr));
          if (!cached) synonymCache.set(synonymKey, lookup);
          synonymTopicIds = lookup.topicIds;
          synonymEntries = lookup.entries;
        }
        const lexiconSynonyms =
          synonymKey && synonymEntries.length
            ? synonymEntries.filter((entry) => {
                const entryNorm =
                  typeof entry['word_norm'] === 'string'
                    ? normalizeSynonymWord(entry['word_norm'])
                    : null;
                return entryNorm && entryNorm !== synonymKey;
              })
            : [];

        if (!lexiconId && lemmaAr && pos) {
          const meta: Record<string, unknown> = {
            source: 'morphology-task',
            container_id: containerId,
            unit_id: unitId,
          };
          if (synonymTopicIds.length) {
            meta['synonym_topic_ids'] = synonymTopicIds;
          }
          const lexiconRow = await upsertArULexicon(
            { DB: ctx.env.DB },
            {
              unitType: 'word',
              surfaceAr: surfaceAr || lemmaAr,
              surfaceNorm: surfaceNorm || lemmaNorm,
              lemmaAr: lemmaAr,
              lemmaNorm: lemmaNorm,
              pos,
              rootNorm: rootNorm ?? null,
              arURoot,
              senseKey: 'sense-1',
              meanings: null,
              synonyms: lexiconSynonyms.length ? lexiconSynonyms : null,
              glossPrimary: translationPrimary,
              glossSecondary: translationAlternatives ?? null,
              usageNotes: translationNotes,
              morphPattern: morphPattern ?? null,
              morphFeatures: morphFeatures,
              morphDerivations: morphDerivations?.length ? morphDerivations : null,
              meta,
            }
          );
          lexiconId = lexiconRow.ar_u_lexicon;
          lexiconUpserted += 1;
        } else if (!lexiconId) {
          lexiconSkipped += 1;
        }

        let arUToken: string | null =
          asString(item['ar_u_token']) ?? asString(item['u_token_id']) ?? null;

        if (lemmaAr && pos) {
          const tokenRow = await upsertArUToken(
            { DB: ctx.env.DB },
            {
              lemmaAr,
              lemmaNorm,
              pos,
              rootNorm: rootNorm ?? null,
              arURoot,
              features: morphFeatures ?? undefined,
              meta: {
                source: 'morphology-task',
                container_id: containerId,
                unit_id: unitId,
              },
            }
          );
          arUToken = tokenRow.ar_u_token;
        }

        let tokenOccId: string | null =
          asString(item['ar_token_occ_id']) ?? asString(item['token_occ_id']) ?? null;
        if (tokenIndex != null && surfaceAr && arUToken) {
          if (!tokenOccId) {
            tokenOccId = await sha256Hex(
              buildCommitId(['occ_token', containerId, unitId, tokenIndex, surfaceAr])
            );
          }

          await ctx.env.DB
            .prepare(
              `
              INSERT OR REPLACE INTO ar_occ_token (
                ar_token_occ_id, user_id, container_id, unit_id, pos_index,
                surface_ar, norm_ar, lemma_ar, pos, ar_u_token, ar_u_root,
                features_json, created_at
              ) VALUES (
                ?1, ?2, ?3, ?4, ?5,
                ?6, ?7, ?8, ?9, ?10, ?11,
                ?12, datetime('now')
              )
            `
            )
            .bind(
              tokenOccId,
              user.id,
              containerId,
              unitId,
              tokenIndex,
              surfaceAr,
              surfaceNorm || normalizeArabic(surfaceAr),
              lemmaAr,
              pos,
              arUToken,
              arURoot,
              toJsonOrNull(morphFeatures)
            )
            .run();

          await upsertTokenMorph(ctx.env.DB, tokenOccId, pos ?? '', morphFeatures);

          if (lexiconId) {
            await insertTokenLexiconLink(ctx.env.DB, tokenOccId, lexiconId);
          }
        }

        if (surfaceAr) item['surface_ar'] = surfaceAr;
        if (surfaceNorm) item['surface_norm'] = surfaceNorm;
        if (lemmaAr) item['lemma_ar'] = lemmaAr;
        if (lemmaNorm) item['lemma_norm'] = lemmaNorm;
        if (rootNorm) item['root_norm'] = rootNorm;
        if (rootRaw && !item['root_ar']) item['root_ar'] = rootRaw;
        if (pos) item['pos'] = pos;
        if (morphPattern) item['morph_pattern'] = morphPattern;
        if (morphFeatures) item['morph_features'] = morphFeatures;
        if (synonymTopicIds.length && !item['topic_id'] && !item['topic_ids']) {
          if (synonymTopicIds.length === 1) {
            item['topic_id'] = synonymTopicIds[0];
          } else {
            item['topic_ids'] = synonymTopicIds;
          }
        }
        if (tokenIndex != null) item['token_index'] = tokenIndex;
        if (!item['word_location'] && tokenIndex != null) {
          const surah = asNumber(item['surah']);
          const ayah = asNumber(item['ayah']);
          if (surah != null && ayah != null) {
            item['word_location'] = `${surah}:${ayah}:${tokenIndex}`;
          }
        }
        if (arURoot) item['ar_u_root'] = arURoot;
        if (arUToken) item['ar_u_token'] = arUToken;
        if (tokenOccId) item['ar_token_occ_id'] = tokenOccId;
        if (lexiconId) {
          item['lexicon_id'] = lexiconId;
          item['ar_u_lexicon'] = lexiconId;
        }

        items.push(item);
      }

      const enriched = {
        ...taskJson,
        schema_version: taskJson.schema_version ?? 1,
        task_type: 'morphology',
        items,
      };

      const taskId = `UT:${unitId}:${taskType}`;
      const taskJsonText = JSON.stringify(enriched);
      const taskName = TASK_LABELS[taskType] ?? taskType;

      await ctx.env.DB
        .prepare(
          `
          INSERT INTO ar_container_unit_task (
            task_id, unit_id, task_type, task_name, task_json, status
          ) VALUES (?1, ?2, ?3, ?4, json(?5), 'draft')
          ON CONFLICT(unit_id, task_type)
          DO UPDATE SET
            task_name = excluded.task_name,
            task_json = excluded.task_json,
            status = excluded.status
        `
        )
        .bind(taskId, unitId, taskType, taskName, taskJsonText)
        .run();

      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            task_json: enriched,
            lexicon_summary: {
              upserted: lexiconUpserted,
              skipped: lexiconSkipped,
            },
          },
        }),
        { headers: jsonHeaders }
      );
    }

    const rawItems = Array.isArray(taskJson.items) ? taskJson.items : [];
    if (!rawItems.length) {
      return new Response(JSON.stringify({ ok: false, error: 'task_json.items[] is required.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const items: SentenceItem[] = [];
    const occSentenceIds: string[] = [];
    const occGrammarIds: string[] = [];

    for (const rawItem of rawItems) {
      const item = asRecord(rawItem) ?? {};
      let canonicalSentence = asString(item.canonical_sentence) ?? '';
      if (!canonicalSentence) {
        const summary = asRecord(item.structure_summary) ?? {};
        canonicalSentence = asString(summary.full_text) ?? '';
      }
      if (!canonicalSentence) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Each item requires canonical_sentence.' }),
          { status: 400, headers: jsonHeaders }
        );
      }
      item.canonical_sentence = canonicalSentence;
      const summary = asRecord(item.structure_summary);
      if (summary && !asString(summary.full_text)) {
        summary.full_text = canonicalSentence;
      }
      const summaryForGrammar = summary ?? (looksLikeStructureSummary(item) ? item : null);

      const textNorm = canonicalize(canonicalSentence);
      const resolved = await upsertArUSentence(
        { DB: ctx.env.DB },
        {
          kind: 'surface',
          sequence: [textNorm],
          textAr: canonicalSentence,
          meta: { source: 'lesson-authoring', container_id: containerId, unit_id: unitId },
        }
      );
      const arUSentence = resolved.ar_u_sentence;

      const stepsRaw = Array.isArray(item.steps) ? item.steps : [];
      const steps: Array<Record<string, unknown>> = [];
      for (const rawStep of stepsRaw) {
        const step = asRecord(rawStep) ?? {};
        const grammarId = asString(step.grammar_id);
        let arUGrammar = asString(step.ar_u_grammar);
        if (grammarId) {
          if (!arUGrammar) {
            const resolvedGrammar = await upsertArUGrammar(
              { DB: ctx.env.DB },
              {
                grammarId,
                category: null,
                title: grammarId,
                titleAr: null,
                definition: null,
                definitionAr: null,
                meta: { source: 'lesson-authoring' },
              }
            );
            arUGrammar = resolvedGrammar.ar_u_grammar;
          }
          step.ar_u_grammar = arUGrammar;
        }
        steps.push(step);
      }

      const tokensRaw = Array.isArray(item.tokens) ? item.tokens : [];
      const tokens: Array<Record<string, unknown>> = [];
      const tokenIdMap = new Map<number, string>();
      for (let i = 0; i < tokensRaw.length; i += 1) {
        const token = asRecord(tokensRaw[i]) ?? {};
        const tokenIndex = asNumber(token.token_index) ?? i;
        const lemmaAr = asString(token.lemma) ?? asString(token.surface) ?? '';
        const lemmaNorm = canonicalize(lemmaAr || '');
        const pos = normalizePos(asString(token.pos), asString(token.pos_detail));
        const rootRaw = asString(token.root);
        let arURoot = asString(token.ar_u_root);
        let rootNorm: string | null = asString(token.root_norm);
        if (!rootNorm && rootRaw) {
          rootNorm = normalizeRoot(rootRaw);
          token.root_norm = rootNorm;
        }
        if (rootRaw && !arURoot) {
          const resolvedRoot = await upsertArURoot(
            { DB: ctx.env.DB },
            {
              root: rootRaw,
              rootNorm: rootNorm ?? normalizeRoot(rootRaw),
              meta: { source: 'lesson-authoring' },
            }
          );
          arURoot = resolvedRoot.ar_u_root;
          token.ar_u_root = arURoot;
        }
        let arUToken = asString(token.ar_u_token);
        if (!arUToken && lemmaAr) {
          const resolvedToken = await upsertArUToken(
            { DB: ctx.env.DB },
            {
              lemmaAr,
              lemmaNorm: lemmaNorm || lemmaAr,
              pos,
              rootNorm: rootNorm ?? null,
              arURoot: arURoot ?? null,
              features: token,
              meta: { source: 'lesson-authoring' },
            }
          );
          arUToken = resolvedToken.ar_u_token;
          token.ar_u_token = arUToken;
        }
        if (typeof tokenIndex === 'number' && arUToken) {
          tokenIdMap.set(tokenIndex, arUToken);
        }
        tokens.push(token);
      }

      const spansRaw = Array.isArray(item.spans) ? item.spans : [];
      const spans: Array<Record<string, unknown>> = [];
      for (let i = 0; i < spansRaw.length; i += 1) {
        const span = asRecord(spansRaw[i]) ?? {};
        const spanType = asString(span.span_type) ?? asString(span.type) ?? 'span';
        const from = asNumber(span.token_from);
        const to = asNumber(span.token_to);
        let arUSpan = asString(span.ar_u_span);
        if (!arUSpan && from != null && to != null) {
          const tokenIds: string[] = [];
          for (let idx = from; idx <= to; idx += 1) {
            const tokenId = tokenIdMap.get(idx);
            if (tokenId) tokenIds.push(tokenId);
          }
          if (tokenIds.length) {
            const resolvedSpan = await upsertArUSpan(
              { DB: ctx.env.DB },
              {
                spanType,
                tokenIds,
                meta: { source: 'lesson-authoring' },
              }
            );
            arUSpan = resolvedSpan.ar_u_span;
            span.ar_u_span = arUSpan;
          }
        }
        spans.push(span);
      }

      const order = Number.isFinite(Number(item.sentence_order)) ? Number(item.sentence_order) : nextOrder(items);
      const occSentenceId = await sha256Hex(`occ_sentence|${containerId}|${unitId}|${order}|${canonicalSentence}`);

      await ctx.env.DB
        .prepare(
          `
          INSERT OR REPLACE INTO ar_occ_sentence (
            ar_sentence_occ_id, user_id, container_id, unit_id, sentence_order,
            text_ar, translation, notes, ar_u_sentence
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        `
        )
        .bind(
          occSentenceId,
          user.id,
          containerId,
          unitId,
          order,
          canonicalSentence,
          null,
          null,
          arUSentence
        )
        .run();

      const grammarRefs: GrammarRef[] = [];
      collectGrammarRefs(steps, grammarRefs);
      collectGrammarRefs(item['grammar_flow'], grammarRefs);
      collectGrammarFromSummary(summaryForGrammar, grammarRefs);
      const resolvedGrammar = new Map<string, string>();
      const insertedGrammar = new Set<string>();

      for (const ref of grammarRefs) {
        let arUGrammar = ref.arUGrammar;
        if (arUGrammar && !isLikelyArUGrammar(arUGrammar)) {
          if (!ref.grammarId) {
            ref.grammarId = arUGrammar;
          }
          arUGrammar = undefined;
        }
        if (!arUGrammar && ref.grammarId) {
          const cacheKey = `grammar:${ref.grammarId}`;
          arUGrammar = resolvedGrammar.get(cacheKey);
          if (!arUGrammar) {
            const resolvedGrammarRow = await upsertArUGrammar(
              { DB: ctx.env.DB },
              {
                grammarId: ref.grammarId,
                category: null,
                title: ref.grammarId,
                titleAr: null,
                definition: null,
                definitionAr: null,
                meta: { source: 'lesson-authoring' },
              }
            );
            arUGrammar = resolvedGrammarRow.ar_u_grammar;
            resolvedGrammar.set(cacheKey, arUGrammar);
          }
        }
        if (!arUGrammar) continue;
        if (ref.record && !asString(ref.record['ar_u_grammar'])) {
          ref.record['ar_u_grammar'] = arUGrammar;
        }
        if (insertedGrammar.has(arUGrammar)) continue;
        insertedGrammar.add(arUGrammar);
        const occGrammarId = await sha256Hex(`occ_grammar|${containerId}|${unitId}|occ_sentence|${occSentenceId}|${arUGrammar}`);
        await ctx.env.DB
          .prepare(
            `
            INSERT OR REPLACE INTO ar_occ_grammar (
              id, user_id, container_id, unit_id, ar_u_grammar, target_type, target_id, note, meta_json, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))
          `
          )
          .bind(
            occGrammarId,
            user.id,
            containerId,
            unitId,
            arUGrammar,
            'occ_sentence',
            occSentenceId,
            null,
            null
          )
          .run();
        occGrammarIds.push(occGrammarId);
      }

      occSentenceIds.push(occSentenceId);

      items.push({
        ...item,
        sentence_order: order,
        canonical_sentence: canonicalSentence,
        ar_u_sentence: arUSentence,
        steps,
        text_norm: textNorm,
        tokens,
        spans,
      });
    }

    if (occSentenceIds.length) {
      const placeholders = occSentenceIds.map(() => '?').join(',');
      await ctx.env.DB
        .prepare(
          `
          DELETE FROM ar_occ_sentence
          WHERE container_id = ?1 AND unit_id = ?2
          AND ar_sentence_occ_id NOT IN (${placeholders})
        `
        )
        .bind(containerId, unitId, ...occSentenceIds)
        .run();

      await ctx.env.DB
        .prepare(
          `
          DELETE FROM ar_occ_grammar
          WHERE container_id = ?1 AND unit_id = ?2 AND target_type = 'occ_sentence'
          AND target_id NOT IN (${placeholders})
        `
        )
        .bind(containerId, unitId, ...occSentenceIds)
        .run();
    } else {
      await ctx.env.DB
        .prepare(
          `
          DELETE FROM ar_occ_sentence
          WHERE container_id = ?1 AND unit_id = ?2
        `
        )
        .bind(containerId, unitId)
        .run();
      await ctx.env.DB
        .prepare(
          `
          DELETE FROM ar_occ_grammar
          WHERE container_id = ?1 AND unit_id = ?2 AND target_type = 'occ_sentence'
        `
        )
        .bind(containerId, unitId)
        .run();
    }

    const enriched = {
      ...taskJson,
      schema_version: taskJson.schema_version ?? 1,
      task_type: 'sentence_structure',
      items,
    };

    const taskId = `UT:${unitId}:${taskType}`;
    const taskJsonText = JSON.stringify(enriched);
    const taskName = TASK_LABELS[taskType] ?? taskType;

    await ctx.env.DB
      .prepare(
        `
        INSERT INTO ar_container_unit_task (
          task_id, unit_id, task_type, task_name, task_json, status
        ) VALUES (?1, ?2, ?3, ?4, json(?5), 'draft')
        ON CONFLICT(unit_id, task_type)
        DO UPDATE SET
          task_name = excluded.task_name,
          task_json = excluded.task_json,
          status = excluded.status
      `
      )
      .bind(taskId, unitId, taskType, taskName, taskJsonText)
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        result: {
          task_json: enriched,
          occ_summary: {
            sentences_upserted: items.length,
            grammar_upserted: occGrammarIds.length,
          },
        },
      }),
      { headers: jsonHeaders }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
