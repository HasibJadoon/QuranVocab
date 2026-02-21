import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../_utils/auth';
import {
  buildTaskCanonicalInput,
  computeWeekStartSydney,
  createDefaultTaskJson,
  insertActivityLog,
  json,
  mapPlannerRow,
  normalizeIsoDate,
  normalizeTaskJson,
  parseBody,
  parseJsonObject,
  readInteger,
  readString,
  readTrimmed,
  sha256Hex,
} from '../_utils/sprint';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

function parseTaskInput(body: Record<string, unknown>) {
  const itemJsonInput = parseJsonObject(body['item_json']);
  if (itemJsonInput) {
    const normalized = normalizeTaskJson(itemJsonInput, readTrimmed(itemJsonInput['title']) ?? 'New task');
    return normalized;
  }

  const fallback = createDefaultTaskJson(readTrimmed(body['title']) ?? 'New task');
  const merged = {
    ...fallback,
    lane: readTrimmed(body['lane']) ?? fallback.lane,
    priority: readTrimmed(body['priority']) ?? fallback.priority,
    status: readTrimmed(body['status']) ?? fallback.status,
    estimate_min: readInteger(body['estimate_min']) ?? fallback.estimate_min,
    note: readString(body['note']) ?? fallback.note,
  };
  return normalizeTaskJson(merged, fallback.title);
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const body = await parseBody(ctx.request);
    if (!body) {
      return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
    }

    const weekRaw = readString(body['week_start']);
    const weekDate = normalizeIsoDate(weekRaw);
    if (weekRaw !== null && !weekDate) {
      return json({ ok: false, error: 'week_start must be YYYY-MM-DD.' }, 400);
    }

    const weekStart = computeWeekStartSydney(weekDate);
    const relatedType = readTrimmed(body['related_type']);
    const relatedId = readTrimmed(body['related_id']);
    const taskJson = parseTaskInput(body);
    const title = taskJson.title.trim() || 'New task';
    const nonce = crypto.randomUUID();
    const canonicalInput = buildTaskCanonicalInput({
      userId: user.id,
      weekStart,
      title,
      nonce,
    });
    const plannerId = await sha256Hex(canonicalInput);

    await ctx.env.DB
      .prepare(
        `
        INSERT INTO sp_planner
          (id, canonical_input, user_id, item_type, week_start, related_type, related_id, item_json, status, created_at)
        VALUES
          (?1, ?2, ?3, 'task', ?4, ?5, ?6, ?7, 'active', datetime('now'))
        `
      )
      .bind(
        plannerId,
        canonicalInput,
        user.id,
        weekStart,
        relatedType ?? null,
        relatedId ?? null,
        JSON.stringify(taskJson)
      )
      .run();

    await insertActivityLog({
      db: ctx.env.DB,
      userId: user.id,
      eventType: 'planner_task_create',
      targetType: 'sp_planner',
      targetId: plannerId,
      ref: weekStart,
      eventJson: {
        title: taskJson.title,
        lane: taskJson.lane,
        status: taskJson.status,
      },
    });

    const rowRaw = await ctx.env.DB
      .prepare(
        `
        SELECT *
        FROM sp_planner
        WHERE id = ?1
          AND user_id = ?2
          AND item_type = 'task'
        LIMIT 1
        `
      )
      .bind(plannerId, user.id)
      .first<Record<string, unknown>>();

    const row = rowRaw ? mapPlannerRow(rowRaw) : null;
    if (!row) {
      return json({ ok: false, error: 'Failed to create task.' }, 500);
    }

    return json(
      {
        ok: true,
        task: {
          ...row,
          item_json: parseJsonObject(row.item_json) ?? {},
        },
      },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task.';
    return json({ ok: false, error: message }, 500);
  }
};
