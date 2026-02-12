import { requireAuth } from '../../../../../_utils/auth';
import {
  canonicalize,
  sha256Hex,
  upsertArUGrammar,
  upsertArULexicon,
  upsertArURoot,
  upsertArUSentence,
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
        const rootNorm = asString(item['root_norm']) ?? asString(item['root']);
        const pos = normalizePos(asString(item['pos']));
        const morphPattern = asString(item['morph_pattern']) ?? asString(item['pattern']);
        const morphFeatures = asRecord(item['morph_features']) ?? asRecord(item['features']);
        const morphDerivations = Array.isArray(item['morph_derivations'])
          ? item['morph_derivations']
          : Array.isArray(item['derivations'])
            ? item['derivations']
            : null;
        const translation = asString(item['translation']) ?? asString(item['gloss']) ?? null;

        let lexiconId =
          asString(item['lexicon_id']) ??
          asString(item['ar_u_lexicon']) ??
          null;

        if (!lexiconId && lemmaAr && pos) {
          let arURoot: string | null = null;
          if (rootNorm) {
            const rootRow = await upsertArURoot(
              { DB: ctx.env.DB },
              {
                root: rootNorm,
                rootNorm,
                meta: { source: 'morphology-task' },
              }
            );
            arURoot = rootRow.ar_u_root;
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
              glossPrimary: translation,
              morphPattern: morphPattern ?? null,
              morphFeatures: morphFeatures,
              morphDerivations: morphDerivations,
              meta: {
                source: 'morphology-task',
                container_id: containerId,
                unit_id: unitId,
              },
            }
          );
          lexiconId = lexiconRow.ar_u_lexicon;
          lexiconUpserted += 1;
        } else if (!lexiconId) {
          lexiconSkipped += 1;
        }

        if (surfaceAr) item['surface_ar'] = surfaceAr;
        if (surfaceNorm) item['surface_norm'] = surfaceNorm;
        if (lemmaAr) item['lemma_ar'] = lemmaAr;
        if (lemmaNorm) item['lemma_norm'] = lemmaNorm;
        if (rootNorm) item['root_norm'] = rootNorm;
        if (pos) item['pos'] = pos;
        if (morphPattern) item['morph_pattern'] = morphPattern;
        if (morphFeatures) item['morph_features'] = morphFeatures;
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
