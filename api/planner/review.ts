import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../_utils/auth';
import {
  addDays,
  buildReviewCanonicalInput,
  computeWeekStartSydney,
  createDefaultSprintReviewJson,
  insertActivityLog,
  json,
  mapPlannerRow,
  normalizeIsoDate,
  normalizeSprintReviewJson,
  parseBody,
  parseJsonObject,
  readInteger,
  readString,
  sha256Hex,
} from '../_utils/sprint';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

async function computeWeekMetrics(db: D1Database, userId: number, weekStart: string) {
  const weekEnd = addDays(weekStart, 6);

  const taskRows = await db
    .prepare(
      `
      SELECT item_json
      FROM sp_planner
      WHERE user_id = ?1
        AND item_type = 'task'
        AND week_start = ?2
      `
    )
    .bind(userId, weekStart)
    .all<Record<string, unknown>>();

  let tasksDone = 0;
  let minutesSpent = 0;
  const tasksTotal = (taskRows.results ?? []).length;
  for (const row of taskRows.results ?? []) {
    const item = parseJsonObject(row['item_json']) ?? {};
    if ((readString(item['status']) ?? '').trim() === 'done') {
      tasksDone += 1;
    }
    const actualMin = readInteger(item['actual_min']);
    if (actualMin !== null && actualMin > 0) {
      minutesSpent += actualMin;
    }
  }

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
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
    minutes_spent: minutesSpent,
    capture_notes: captureNotes,
    promoted_notes: promotedNotes,
  };
}

async function upsertReview(
  db: D1Database,
  userId: number,
  weekStart: string,
  itemJson: Record<string, unknown>
) {
  const canonicalInput = buildReviewCanonicalInput(userId, weekStart);
  const plannerId = await sha256Hex(canonicalInput);
  const periodStart = weekStart;
  const periodEnd = addDays(weekStart, 6);

  await db
    .prepare(
      `
      INSERT OR REPLACE INTO sp_planner
        (id, canonical_input, user_id, item_type, week_start, period_start, period_end, item_json, status, updated_at)
      VALUES
        (?1, ?2, ?3, 'sprint_review', ?4, ?5, ?6, ?7, 'active', datetime('now'))
      `
    )
    .bind(plannerId, canonicalInput, userId, weekStart, periodStart, periodEnd, JSON.stringify(itemJson))
    .run();

  return plannerId;
}

async function readReviewRow(db: D1Database, userId: number, reviewId: string) {
  const raw = await db
    .prepare(
      `
      SELECT *
      FROM sp_planner
      WHERE id = ?1
        AND user_id = ?2
        AND item_type = 'sprint_review'
      LIMIT 1
      `
    )
    .bind(reviewId, userId)
    .first<Record<string, unknown>>();

  const row = raw ? mapPlannerRow(raw) : null;
  if (!row) {
    return null;
  }

  return {
    ...row,
    item_json: parseJsonObject(row.item_json) ?? {},
  };
}

async function handleUpsert(ctx: Parameters<PagesFunction<Env>>[0]) {
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
  const metrics = await computeWeekMetrics(ctx.env.DB, user.id, weekStart);
  const inputJson = parseJsonObject(body['item_json']);
  const normalized = normalizeSprintReviewJson(inputJson, weekStart);
  normalized.metrics = metrics;

  const reviewId = await upsertReview(ctx.env.DB, user.id, weekStart, normalized);

  await insertActivityLog({
    db: ctx.env.DB,
    userId: user.id,
    eventType: 'planner_review_upsert',
    targetType: 'sp_planner',
    targetId: reviewId,
    ref: weekStart,
    eventJson: metrics,
  });

  const review = await readReviewRow(ctx.env.DB, user.id, reviewId);
  if (!review) {
    return json({ ok: false, error: 'Failed to save sprint review.' }, 500);
  }

  return json({
    ok: true,
    week_start: weekStart,
    review,
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    return await handleUpsert(ctx);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save sprint review.';
    return json({ ok: false, error: message }, 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try {
    return await handleUpsert(ctx);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save sprint review.';
    return json({ ok: false, error: message }, 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const url = new URL(ctx.request.url);
    const weekRaw = url.searchParams.get('week_start');
    const weekDate = normalizeIsoDate(weekRaw);
    if (weekRaw && !weekDate) {
      return json({ ok: false, error: 'week_start must be YYYY-MM-DD.' }, 400);
    }

    const weekStart = computeWeekStartSydney(weekDate);
    const canonical = buildReviewCanonicalInput(user.id, weekStart);
    const reviewId = await sha256Hex(canonical);
    let review = await readReviewRow(ctx.env.DB, user.id, reviewId);

    if (!review) {
      const metrics = await computeWeekMetrics(ctx.env.DB, user.id, weekStart);
      const fallback = createDefaultSprintReviewJson(weekStart);
      fallback.metrics = metrics;
      review = {
        id: reviewId,
        canonical_input: canonical,
        user_id: user.id,
        item_type: 'sprint_review',
        week_start: weekStart,
        period_start: weekStart,
        period_end: addDays(weekStart, 6),
        item_json: fallback,
        status: 'active',
        created_at: '',
        updated_at: null,
      };
    }

    return json({
      ok: true,
      week_start: weekStart,
      review,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load sprint review.';
    return json({ ok: false, error: message }, 500);
  }
};
