import { requireAuth } from '../../../../../_utils/auth';
import { canonicalize, sha256Hex, upsertArUGrammar, upsertArUSentence } from '../../../../../_utils/universal';

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
};

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

function nextOrder(items: SentenceItem[]): number {
  const orders = items.map((item) => asNumber(item.sentence_order)).filter((n): n is number => n != null);
  if (!orders.length) return 1;
  return Math.max(...orders) + 1;
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
    if (taskType !== 'sentence_structure') {
      return new Response(JSON.stringify({ ok: false, error: 'Only sentence_structure supported.' }), {
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

      for (const step of steps) {
        const grammarId = asString(step.grammar_id);
        const arUGrammar = asString(step.ar_u_grammar);
        if (!grammarId || !arUGrammar) continue;
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
