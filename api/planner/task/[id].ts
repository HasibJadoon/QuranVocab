import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../../_utils/auth';
import {
  insertActivityLog,
  json,
  mapPlannerRow,
  normalizeTaskJson,
  parseBody,
  parseJsonObject,
  readString,
  readTrimmed,
} from '../../_utils/sprint';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

function readParam(params: Record<string, unknown> | undefined, key: string): string {
  const value = params?.[key];
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0].trim();
  }
  return '';
}

function mergeTaskPatch(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing };
  const keys: Array<keyof typeof next> = [
    'lane',
    'title',
    'priority',
    'status',
    'estimate_min',
    'actual_min',
    'tags',
    'checklist',
    'note',
    'links',
    'capture_on_done',
    'order_index',
  ];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = patch[key];
    }
  }

  return next;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const taskId = readParam(ctx.params, 'id');
    if (!taskId) {
      return json({ ok: false, error: 'Task id is required.' }, 400);
    }

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
      .bind(taskId, user.id)
      .first<Record<string, unknown>>();

    const row = rowRaw ? mapPlannerRow(rowRaw) : null;
    if (!row) {
      return json({ ok: false, error: 'Task not found.' }, 404);
    }

    return json({
      ok: true,
      task: {
        ...row,
        item_json: parseJsonObject(row.item_json) ?? {},
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load task.';
    return json({ ok: false, error: message }, 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const taskId = readParam(ctx.params, 'id');
    if (!taskId) {
      return json({ ok: false, error: 'Task id is required.' }, 400);
    }

    const existingRaw = await ctx.env.DB
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
      .bind(taskId, user.id)
      .first<Record<string, unknown>>();

    const existingRow = existingRaw ? mapPlannerRow(existingRaw) : null;
    if (!existingRow) {
      return json({ ok: false, error: 'Task not found.' }, 404);
    }

    const body = await parseBody(ctx.request);
    if (!body) {
      return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
    }

    const existingJson = parseJsonObject(existingRow.item_json) ?? {};
    const incomingItemJson = parseJsonObject(body['item_json']);
    const mergedJson = incomingItemJson
      ? normalizeTaskJson(incomingItemJson, readTrimmed(incomingItemJson['title']) ?? 'Task')
      : normalizeTaskJson(mergeTaskPatch(existingJson, body), readTrimmed(existingJson['title']) ?? 'Task');

    const relatedType = Object.prototype.hasOwnProperty.call(body, 'related_type')
      ? readTrimmed(body['related_type'])
      : readString(existingRow.related_type);
    const relatedId = Object.prototype.hasOwnProperty.call(body, 'related_id')
      ? readTrimmed(body['related_id'])
      : readString(existingRow.related_id);

    await ctx.env.DB
      .prepare(
        `
        UPDATE sp_planner
        SET related_type = ?1,
            related_id = ?2,
            item_json = ?3,
            updated_at = datetime('now')
        WHERE id = ?4
          AND user_id = ?5
        `
      )
      .bind(relatedType ?? null, relatedId ?? null, JSON.stringify(mergedJson), taskId, user.id)
      .run();

    await insertActivityLog({
      db: ctx.env.DB,
      userId: user.id,
      eventType: 'planner_task_update',
      targetType: 'sp_planner',
      targetId: taskId,
      ref: existingRow.week_start,
      eventJson: {
        lane: mergedJson.lane,
        status: mergedJson.status,
        priority: mergedJson.priority,
      },
    });

    const updatedRaw = await ctx.env.DB
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
      .bind(taskId, user.id)
      .first<Record<string, unknown>>();

    const updated = updatedRaw ? mapPlannerRow(updatedRaw) : null;
    if (!updated) {
      return json({ ok: false, error: 'Task not found after update.' }, 404);
    }

    return json({
      ok: true,
      task: {
        ...updated,
        item_json: parseJsonObject(updated.item_json) ?? {},
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task.';
    return json({ ok: false, error: message }, 500);
  }
};
