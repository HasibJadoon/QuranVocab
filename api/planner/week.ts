import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../_utils/auth';
import {
  addDays,
  buildWeekCanonicalInput,
  computeWeekStartSydney,
  createDefaultWeekPlanJson,
  insertActivityLog,
  json,
  mapPlannerRow,
  normalizeIsoDate,
  normalizeWeekPlanJson,
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

type WeekPayload = {
  weekPlan: Record<string, unknown> | null;
  tasks: Array<Record<string, unknown>>;
  review: Record<string, unknown> | null;
  summary: {
    tasks_done: number;
    tasks_total: number;
    minutes_spent: number;
    inbox_count: number;
    capture_notes: number;
    promoted_notes: number;
  };
};

async function loadWeekData(db: D1Database, userId: number, weekStart: string): Promise<WeekPayload> {
  const plannerResult = await db
    .prepare(
      `
      SELECT *
      FROM sp_planner
      WHERE user_id = ?1
        AND item_type IN ('week_plan', 'task', 'sprint_review')
        AND week_start = ?2
      ORDER BY created_at ASC
      `
    )
    .bind(userId, weekStart)
    .all<Record<string, unknown>>();

  const rows = (plannerResult.results ?? [])
    .map((row) => mapPlannerRow(row))
    .filter((row): row is NonNullable<ReturnType<typeof mapPlannerRow>> => row !== null);

  let weekPlan: Record<string, unknown> | null = null;
  let review: Record<string, unknown> | null = null;
  const tasks: Array<Record<string, unknown>> = [];
  let tasksDone = 0;
  let minutesSpent = 0;

  for (const row of rows) {
    const itemJson = parseJsonObject(row.item_json) ?? {};
    const payload = {
      id: row.id,
      canonical_input: row.canonical_input,
      user_id: row.user_id,
      item_type: row.item_type,
      week_start: row.week_start,
      period_start: row.period_start,
      period_end: row.period_end,
      related_type: row.related_type,
      related_id: row.related_id,
      item_json: itemJson,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.item_type === 'week_plan') {
      weekPlan = payload;
      continue;
    }

    if (row.item_type === 'sprint_review') {
      review = payload;
      continue;
    }

    tasks.push(payload);
    const status = readTrimmed(itemJson['status']);
    if (status === 'done') {
      tasksDone += 1;
    }
    const actualMin = readInteger(itemJson['actual_min']);
    if (actualMin !== null && actualMin > 0) {
      minutesSpent += actualMin;
    }
  }

  const weekEnd = addDays(weekStart, 6);

  const inboxCountRow = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM ar_capture_notes
      WHERE user_id = ?1
        AND status = 'inbox'
      `
    )
    .bind(userId)
    .first<Record<string, unknown>>();
  const inboxCount = readInteger(inboxCountRow?.['count']) ?? 0;

  const captureCountRow = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM ar_capture_notes
      WHERE user_id = ?1
        AND date(created_at) >= ?2
        AND date(created_at) <= ?3
      `
    )
    .bind(userId, weekStart, weekEnd)
    .first<Record<string, unknown>>();
  const captureNotes = readInteger(captureCountRow?.['count']) ?? 0;

  const promotedCountRow = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM ar_notes
      WHERE user_id = ?1
        AND date(created_at) >= ?2
        AND date(created_at) <= ?3
      `
    )
    .bind(userId, weekStart, weekEnd)
    .first<Record<string, unknown>>();
  const promotedNotes = readInteger(promotedCountRow?.['count']) ?? 0;

  return {
    weekPlan,
    tasks,
    review,
    summary: {
      tasks_done: tasksDone,
      tasks_total: tasks.length,
      minutes_spent: minutesSpent,
      inbox_count: inboxCount,
      capture_notes: captureNotes,
      promoted_notes: promotedNotes,
    },
  };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const url = new URL(ctx.request.url);
    const weekStartRaw = url.searchParams.get('week_start');
    const normalized = normalizeIsoDate(weekStartRaw);
    if (weekStartRaw && !normalized) {
      return json({ ok: false, error: 'week_start must be YYYY-MM-DD.' }, 400);
    }

    const weekStart = computeWeekStartSydney(normalized);
    const payload = await loadWeekData(ctx.env.DB, user.id, weekStart);

    return json({
      ok: true,
      week_start: weekStart,
      ...payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load planner week.';
    return json({ ok: false, error: message }, 500);
  }
};

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

    const weekInput = readString(body['week_start']);
    const weekDate = normalizeIsoDate(weekInput);
    if (weekInput !== null && !weekDate) {
      return json({ ok: false, error: 'week_start must be YYYY-MM-DD.' }, 400);
    }

    const weekStart = computeWeekStartSydney(weekDate);
    const title = readTrimmed(body['title']) ?? null;
    const customJson = parseJsonObject(body['item_json']);
    const itemJson = normalizeWeekPlanJson(customJson, weekStart, title);

    const canonicalInput = buildWeekCanonicalInput(user.id, weekStart);
    const plannerId = await sha256Hex(canonicalInput);

    const insertResult = await ctx.env.DB
      .prepare(
        `
        INSERT OR IGNORE INTO sp_planner
          (id, canonical_input, user_id, item_type, week_start, item_json, status, created_at)
        VALUES
          (?1, ?2, ?3, 'week_plan', ?4, ?5, 'active', datetime('now'))
        `
      )
      .bind(plannerId, canonicalInput, user.id, weekStart, JSON.stringify(itemJson))
      .run();

    if ((insertResult.meta?.changes ?? 0) > 0) {
      await insertActivityLog({
        db: ctx.env.DB,
        userId: user.id,
        eventType: 'planner_week_create',
        targetType: 'sp_planner',
        targetId: plannerId,
        ref: weekStart,
        eventJson: { week_start: weekStart },
      });
    }

    const payload = await loadWeekData(ctx.env.DB, user.id, weekStart);
    return json(
      {
        ok: true,
        week_start: weekStart,
        ...payload,
      },
      (insertResult.meta?.changes ?? 0) > 0 ? 201 : 200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create week plan.';
    return json({ ok: false, error: message }, 500);
  }
};
