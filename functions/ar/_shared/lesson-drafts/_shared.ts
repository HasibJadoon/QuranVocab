import { requireAuth, type AuthedUser } from '../../../_utils/auth';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const jsonHeaders: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

export type JsonRecord = Record<string, unknown>;

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

export function badRequest(message: string, details?: unknown) {
  return jsonResponse({ ok: false, error: message, details }, 400);
}

export function unauthorized() {
  return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
}

export function conflict(message: string, currentVersion?: number) {
  return jsonResponse(
    { ok: false, error: message, current_version: currentVersion ?? null },
    409
  );
}

export function notFound(message = 'Not found') {
  return jsonResponse({ ok: false, error: message }, 404);
}

export async function requireUser(ctx: { request: Request; env: Env }): Promise<AuthedUser | null> {
  return requireAuth(ctx);
}

export async function parseJsonBody(ctx: { request: Request }) {
  try {
    return await ctx.request.json();
  } catch {
    return null;
  }
}

export function paramToString(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function safeJsonParse(text: string | null): JsonRecord | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as JsonRecord;
  } catch {
    return null;
  }
}

export function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as JsonRecord;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

export function asInteger(value: unknown): number | null {
  const parsed = asNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

export function clampInt(value: unknown, min: number, max: number): number | null {
  const parsed = asInteger(value);
  if (parsed == null) return null;
  return Math.min(max, Math.max(min, parsed));
}

export function buildInitialDraft(args: {
  lessonType: string;
  subtype?: string | null;
  source?: string | null;
  initialReference?: JsonRecord | null;
}) {
  const reference = args.initialReference ?? {};
  const containerId = asString(reference.container_id) ?? asString(reference.containerId) ?? null;
  const unitId = asString(reference.unit_id) ?? asString(reference.unitId) ?? null;
  const surah = asInteger(reference.surah);
  const ayahFrom = asInteger(reference.ayah_from ?? reference.ayahFrom);
  const ayahTo = asInteger(reference.ayah_to ?? reference.ayahTo);

  return {
    schema_version: 1,
    meta: {
      title: '',
      title_ar: null,
      lesson_type: args.lessonType,
      subtype: args.subtype ?? null,
      difficulty: null,
      source: args.source ?? null,
    },
    reference: {
      container_id: containerId,
      unit_id: unitId,
      surah: surah ?? null,
      ayah_from: ayahFrom ?? null,
      ayah_to: ayahTo ?? null,
    },
    units: [],
    sentences: [],
    comprehension: {
      mcqs: [],
      reflective: [],
      analytical: [],
    },
    notes: [],
  };
}

export type DraftRow = {
  draft_id: string;
  lesson_id: number | null;
  user_id: number;
  lesson_type: string;
  status: string;
  active_step: string | null;
  draft_version: number;
  draft_json: string;
};

export async function fetchDraft(
  db: D1Database,
  draftId: string,
  userId: number
): Promise<DraftRow | null> {
  const row = (await db
    .prepare(
      `
      SELECT draft_id, lesson_id, user_id, lesson_type, status, active_step, draft_version, draft_json
      FROM ar_lesson_drafts
      WHERE draft_id = ?1 AND user_id = ?2
    `
    )
    .bind(draftId, userId)
    .first()) as DraftRow | null;
  return row ?? null;
}
