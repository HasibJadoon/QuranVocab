import type { D1Database } from '@cloudflare/workers-types';

export type PlannerLane = 'lesson' | 'podcast' | 'notes' | 'admin';
export type PlannerPriority = 'P1' | 'P2' | 'P3';
export type PlannerTaskStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type FocusMode = 'planning' | 'studying' | 'producing' | 'reviewing';
export type CaptureSource = 'weekly' | 'lesson' | 'podcast';

const JSON_HEADERS: HeadersInit = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const META_PREFIX = '<!--meta:';
const META_RE = /^\s*<!--meta:(\{[\s\S]*?\})-->\s*/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const sydneyDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Australia/Sydney',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export interface CaptureNoteMeta {
  schema_version: 1;
  kind: 'capture';
  week_start: string;
  source: CaptureSource;
  related_type?: string;
  related_id?: string;
  container_id?: string;
  unit_id?: string;
  ref?: string;
  task_type?: string;
}

export interface ParsedCaptureBody {
  meta: CaptureNoteMeta | null;
  text: string;
}

export interface PlannerWeekPlanJson {
  schema_version: 1;
  title: string;
  intent: string;
  weekly_goals: Array<{ id: string; label: string; done: boolean }>;
  time_budget: {
    study_minutes: number;
    podcast_minutes: number;
    review_minutes: number;
  };
  lanes: Array<{ key: PlannerLane; label: string }>;
  definition_of_done: string[];
  metrics: {
    tasks_done_target: number;
    minutes_target: number;
  };
}

export interface PlannerTaskJson {
  schema_version: 1;
  lane: PlannerLane;
  title: string;
  priority: PlannerPriority;
  status: PlannerTaskStatus;
  estimate_min: number;
  actual_min: number | null;
  tags: string[];
  checklist: Array<{ id: string; label: string; done: boolean }>;
  note: string;
  links: Array<{
    kind: string;
    container_id?: string;
    unit_id?: string;
    ref?: string;
  }>;
  capture_on_done: {
    create_capture_note: boolean;
    template: string;
  };
  order_index?: number;
}

export interface SprintReviewJson {
  schema_version: 1;
  title: string;
  outcomes: Array<{ label: string; status: 'partial' | 'done' | 'missed' }>;
  metrics: {
    tasks_done: number;
    tasks_total: number;
    minutes_spent: number;
    capture_notes: number;
    promoted_notes: number;
  };
  what_worked: string[];
  what_blocked: string[];
  carry_over_task_ids: string[];
  next_week_focus: string[];
}

export interface PlannerRow {
  id: string;
  canonical_input: string;
  user_id: number;
  item_type: 'week_plan' | 'task' | 'sprint_review';
  week_start: string | null;
  period_start: string | null;
  period_end: string | null;
  related_type: string | null;
  related_id: string | null;
  item_json: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

type JsonObject = Record<string, unknown>;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export async function parseBody(request: { json: () => Promise<unknown> }): Promise<JsonObject | null> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return asRecord(payload);
}

export function asRecord(value: unknown): JsonObject | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function readTrimmed(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function readOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return readString(value);
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function readInteger(value: unknown): number | null {
  const numberValue = readNumber(value);
  if (numberValue === null) {
    return null;
  }
  return Number.isInteger(numberValue) ? numberValue : Math.trunc(numberValue);
}

export function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!ISO_DATE_RE.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isoDateFromDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sydneyDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  const parts = sydneyDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '');
  const weekdayToken = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const weekday = WEEKDAY_INDEX[weekdayToken] ?? 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error('Unable to resolve Australia/Sydney date parts.');
  }

  return {
    year,
    month,
    day,
    weekday,
  };
}

function coerceDateInput(input?: string | Date | number | null): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (typeof input === 'number' && Number.isFinite(input)) {
    return new Date(input);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (ISO_DATE_RE.test(trimmed)) {
      return new Date(`${trimmed}T12:00:00Z`);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export function computeWeekStartSydney(input?: string | Date | number | null): string {
  const date = coerceDateInput(input);
  const parts = sydneyDateParts(date);
  const anchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const daysFromMonday = (parts.weekday + 6) % 7;
  anchor.setUTCDate(anchor.getUTCDate() - daysFromMonday);
  return isoDateFromDate(anchor);
}

export function addDays(isoDate: string, dayDelta: number): string {
  const normalized = normalizeIsoDate(isoDate);
  if (!normalized) {
    throw new Error('Invalid ISO date.');
  }
  const value = new Date(`${normalized}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + dayDelta);
  return isoDateFromDate(value);
}

export function parseJsonObject(value: unknown): JsonObject | null {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

export function toJsonText(value: unknown): string {
  return JSON.stringify(value);
}

export async function sha256Hex(value: string): Promise<string> {
  const payload = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest))
    .map((chunk) => chunk.toString(16).padStart(2, '0'))
    .join('');
}

export function createDefaultWeekPlanJson(weekStart: string, title?: string | null): PlannerWeekPlanJson {
  return {
    schema_version: 1,
    title: title?.trim() || `Week Sprint — ${weekStart}`,
    intent: 'Learn + produce',
    weekly_goals: [
      { id: 'g1', label: 'Finish Lesson: Quran study focus', done: false },
    ],
    time_budget: { study_minutes: 420, podcast_minutes: 180, review_minutes: 60 },
    lanes: [
      { key: 'lesson', label: 'Lesson' },
      { key: 'podcast', label: 'Podcast' },
      { key: 'notes', label: 'Notes' },
      { key: 'admin', label: 'Admin' },
    ],
    definition_of_done: [
      'Lesson tasks marked done',
      'Key notes captured + promoted',
      'Podcast outline + recording draft stored',
    ],
    metrics: { tasks_done_target: 12, minutes_target: 600 },
  };
}

export function normalizeWeekPlanJson(
  input: unknown,
  weekStart: string,
  title?: string | null
): PlannerWeekPlanJson {
  const fallback = createDefaultWeekPlanJson(weekStart, title);
  const record = asRecord(input);
  if (!record) {
    return fallback;
  }

  const mergedTitle = readTrimmed(record['title']) ?? fallback.title;
  const mergedIntent = readTrimmed(record['intent']) ?? fallback.intent;
  const goals = Array.isArray(record['weekly_goals']) ? record['weekly_goals'] : fallback.weekly_goals;
  const lanes = Array.isArray(record['lanes']) ? record['lanes'] : fallback.lanes;
  const definitionOfDone = Array.isArray(record['definition_of_done'])
    ? record['definition_of_done'].filter((item): item is string => typeof item === 'string')
    : fallback.definition_of_done;
  const timeBudgetSource = asRecord(record['time_budget']);
  const metricsSource = asRecord(record['metrics']);

  return {
    schema_version: 1,
    title: mergedTitle,
    intent: mergedIntent,
    weekly_goals: goals
      .map((goal, index) => {
        const goalRecord = asRecord(goal);
        if (!goalRecord) {
          return null;
        }
        const label = readTrimmed(goalRecord['label']);
        if (!label) {
          return null;
        }
        return {
          id: readTrimmed(goalRecord['id']) ?? `g${index + 1}`,
          label,
          done: Boolean(goalRecord['done']),
        };
      })
      .filter((goal): goal is { id: string; label: string; done: boolean } => goal !== null),
    time_budget: {
      study_minutes: readInteger(timeBudgetSource?.['study_minutes']) ?? fallback.time_budget.study_minutes,
      podcast_minutes: readInteger(timeBudgetSource?.['podcast_minutes']) ?? fallback.time_budget.podcast_minutes,
      review_minutes: readInteger(timeBudgetSource?.['review_minutes']) ?? fallback.time_budget.review_minutes,
    },
    lanes: lanes
      .map((lane) => {
        const laneRecord = asRecord(lane);
        if (!laneRecord) {
          return null;
        }
        const key = readTrimmed(laneRecord['key']);
        const label = readTrimmed(laneRecord['label']);
        if (!key || !label || !isLane(key)) {
          return null;
        }
        return {
          key,
          label,
        };
      })
      .filter((lane): lane is { key: PlannerLane; label: string } => lane !== null),
    definition_of_done: definitionOfDone.length > 0 ? definitionOfDone : fallback.definition_of_done,
    metrics: {
      tasks_done_target:
        readInteger(metricsSource?.['tasks_done_target']) ?? fallback.metrics.tasks_done_target,
      minutes_target: readInteger(metricsSource?.['minutes_target']) ?? fallback.metrics.minutes_target,
    },
  };
}

export function createDefaultTaskJson(title = 'New task'): PlannerTaskJson {
  return {
    schema_version: 1,
    lane: 'lesson',
    title,
    priority: 'P2',
    status: 'todo',
    estimate_min: 30,
    actual_min: null,
    tags: [],
    checklist: [],
    note: '',
    links: [],
    capture_on_done: {
      create_capture_note: true,
      template: 'What did I learn? What confused me? One next step.',
    },
    order_index: Date.now(),
  };
}

export function normalizeTaskJson(input: unknown, titleFallback = 'New task'): PlannerTaskJson {
  const fallback = createDefaultTaskJson(titleFallback);
  const record = asRecord(input);
  if (!record) {
    return fallback;
  }

  const lane = readTrimmed(record['lane']);
  const priority = readTrimmed(record['priority']);
  const status = readTrimmed(record['status']);
  const captureConfig = asRecord(record['capture_on_done']);

  return {
    schema_version: 1,
    lane: lane && isLane(lane) ? lane : fallback.lane,
    title: readTrimmed(record['title']) ?? fallback.title,
    priority: priority && isPriority(priority) ? priority : fallback.priority,
    status: status && isTaskStatus(status) ? status : fallback.status,
    estimate_min: readInteger(record['estimate_min']) ?? fallback.estimate_min,
    actual_min: readNumber(record['actual_min']),
    tags: Array.isArray(record['tags'])
      ? record['tags'].filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      : [],
    checklist: Array.isArray(record['checklist'])
      ? record['checklist']
          .map((item, index) => {
            const itemRecord = asRecord(item);
            const label = readTrimmed(itemRecord?.['label']);
            if (!label) {
              return null;
            }
            return {
              id: readTrimmed(itemRecord?.['id']) ?? `c${index + 1}`,
              label,
              done: Boolean(itemRecord?.['done']),
            };
          })
          .filter((item): item is { id: string; label: string; done: boolean } => item !== null)
      : [],
    note: readString(record['note']) ?? '',
    links: (() => {
      if (!Array.isArray(record['links'])) {
        return [] as Array<{ kind: string; container_id?: string; unit_id?: string; ref?: string }>;
      }

      const output: Array<{ kind: string; container_id?: string; unit_id?: string; ref?: string }> = [];
      for (const entry of record['links']) {
        const linkRecord = asRecord(entry);
        const kind = readTrimmed(linkRecord?.['kind']);
        if (!kind) {
          continue;
        }
        const nextLink: { kind: string; container_id?: string; unit_id?: string; ref?: string } = { kind };
        const containerId = readTrimmed(linkRecord?.['container_id']);
        const unitId = readTrimmed(linkRecord?.['unit_id']);
        const ref = readTrimmed(linkRecord?.['ref']);
        if (containerId) nextLink.container_id = containerId;
        if (unitId) nextLink.unit_id = unitId;
        if (ref) nextLink.ref = ref;
        output.push(nextLink);
      }
      return output;
    })(),
    capture_on_done: {
      create_capture_note: Boolean(
        captureConfig?.['create_capture_note'] ?? fallback.capture_on_done.create_capture_note
      ),
      template: readTrimmed(captureConfig?.['template']) ?? fallback.capture_on_done.template,
    },
    order_index: readInteger(record['order_index']) ?? fallback.order_index,
  };
}

export function createDefaultSprintReviewJson(weekStart: string): SprintReviewJson {
  return {
    schema_version: 1,
    title: `Sprint Review — Week of ${weekStart}`,
    outcomes: [],
    metrics: {
      tasks_done: 0,
      tasks_total: 0,
      minutes_spent: 0,
      capture_notes: 0,
      promoted_notes: 0,
    },
    what_worked: [],
    what_blocked: [],
    carry_over_task_ids: [],
    next_week_focus: [],
  };
}

export function normalizeSprintReviewJson(input: unknown, weekStart: string): SprintReviewJson {
  const fallback = createDefaultSprintReviewJson(weekStart);
  const record = asRecord(input);
  if (!record) {
    return fallback;
  }

  const metrics = asRecord(record['metrics']);
  return {
    schema_version: 1,
    title: readTrimmed(record['title']) ?? fallback.title,
    outcomes: Array.isArray(record['outcomes'])
      ? record['outcomes']
          .map((outcome) => {
            const item = asRecord(outcome);
            const label = readTrimmed(item?.['label']);
            const status = readTrimmed(item?.['status']);
            if (!label || !status || !isReviewOutcomeStatus(status)) {
              return null;
            }
            return { label, status };
          })
          .filter((outcome): outcome is { label: string; status: 'partial' | 'done' | 'missed' } => outcome !== null)
      : [],
    metrics: {
      tasks_done: readInteger(metrics?.['tasks_done']) ?? fallback.metrics.tasks_done,
      tasks_total: readInteger(metrics?.['tasks_total']) ?? fallback.metrics.tasks_total,
      minutes_spent: readInteger(metrics?.['minutes_spent']) ?? fallback.metrics.minutes_spent,
      capture_notes: readInteger(metrics?.['capture_notes']) ?? fallback.metrics.capture_notes,
      promoted_notes: readInteger(metrics?.['promoted_notes']) ?? fallback.metrics.promoted_notes,
    },
    what_worked: toStringArray(record['what_worked']),
    what_blocked: toStringArray(record['what_blocked']),
    carry_over_task_ids: toStringArray(record['carry_over_task_ids']),
    next_week_focus: toStringArray(record['next_week_focus']),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

export function composeCaptureBody(meta: CaptureNoteMeta, text: string): string {
  const sanitizedText = text.replace(/^\s+/, '');
  return `${META_PREFIX}${JSON.stringify(meta)}-->\n${sanitizedText}`;
}

export function parseCaptureBody(bodyMarkdown: string): ParsedCaptureBody {
  const content = bodyMarkdown ?? '';
  const match = content.match(META_RE);
  if (!match) {
    return {
      meta: null,
      text: content.trim(),
    };
  }

  const metaRaw = match[1];
  const rest = content.slice(match[0].length).trim();
  try {
    const parsed = JSON.parse(metaRaw) as unknown;
    const record = asRecord(parsed);
    if (!record) {
      return { meta: null, text: rest };
    }
    const weekStart = normalizeIsoDate(readString(record['week_start']));
    const source = readTrimmed(record['source']);
    if (!weekStart || !source || !isCaptureSource(source)) {
      return { meta: null, text: rest };
    }
    return {
      meta: {
        schema_version: 1,
        kind: 'capture',
        week_start: weekStart,
        source,
        related_type: readTrimmed(record['related_type']) ?? undefined,
        related_id: readTrimmed(record['related_id']) ?? undefined,
        container_id: readTrimmed(record['container_id']) ?? undefined,
        unit_id: readTrimmed(record['unit_id']) ?? undefined,
        ref: readTrimmed(record['ref']) ?? undefined,
        task_type: readTrimmed(record['task_type']) ?? undefined,
      },
      text: rest,
    };
  } catch {
    return {
      meta: null,
      text: rest,
    };
  }
}

export function buildTaskCanonicalInput(args: {
  userId: number;
  weekStart: string;
  title: string;
  nonce: string;
}): string {
  return `PLANNER|task|user:${args.userId}|week:${args.weekStart}|title:${args.title}|nonce:${args.nonce}`;
}

export function buildWeekCanonicalInput(userId: number, weekStart: string): string {
  return `PLANNER|week_plan|user:${userId}|week:${weekStart}`;
}

export function buildReviewCanonicalInput(userId: number, weekStart: string): string {
  return `PLANNER|sprint_review|user:${userId}|week:${weekStart}`;
}

export async function insertActivityLog(args: {
  db: D1Database;
  userId: number;
  eventType: string;
  targetType?: string | null;
  targetId?: string | null;
  ref?: string | null;
  note?: string | null;
  eventJson?: unknown;
}): Promise<void> {
  await args.db
    .prepare(
      `
      INSERT INTO user_activity_logs (user_id, event_type, target_type, target_id, ref, note, event_json, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
      `
    )
    .bind(
      args.userId,
      args.eventType,
      args.targetType ?? null,
      args.targetId ?? null,
      args.ref ?? null,
      args.note ?? null,
      args.eventJson === undefined ? null : JSON.stringify(args.eventJson)
    )
    .run();
}

export function mapPlannerRow(raw: Record<string, unknown>): PlannerRow | null {
  const id = readTrimmed(raw['id']);
  const canonicalInput = readTrimmed(raw['canonical_input']);
  const userId = readInteger(raw['user_id']);
  const itemType = readTrimmed(raw['item_type']);
  const itemJson = readString(raw['item_json']);
  const status = readTrimmed(raw['status']);
  const createdAt = readString(raw['created_at']);
  if (
    !id ||
    !canonicalInput ||
    userId === null ||
    !itemType ||
    !isPlannerItemType(itemType) ||
    itemJson === null ||
    !status ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    canonical_input: canonicalInput,
    user_id: userId,
    item_type: itemType,
    week_start: readString(raw['week_start']),
    period_start: readString(raw['period_start']),
    period_end: readString(raw['period_end']),
    related_type: readString(raw['related_type']),
    related_id: readString(raw['related_id']),
    item_json: itemJson,
    status,
    created_at: createdAt,
    updated_at: readString(raw['updated_at']),
  };
}

export function isLane(value: string): value is PlannerLane {
  return value === 'lesson' || value === 'podcast' || value === 'notes' || value === 'admin';
}

export function isPriority(value: string): value is PlannerPriority {
  return value === 'P1' || value === 'P2' || value === 'P3';
}

export function isTaskStatus(value: string): value is PlannerTaskStatus {
  return value === 'todo' || value === 'doing' || value === 'done' || value === 'blocked';
}

export function isCaptureSource(value: string): value is CaptureSource {
  return value === 'weekly' || value === 'lesson' || value === 'podcast';
}

export function isPlannerItemType(
  value: string
): value is 'week_plan' | 'task' | 'sprint_review' {
  return value === 'week_plan' || value === 'task' || value === 'sprint_review';
}

export function isReviewOutcomeStatus(value: string): value is 'partial' | 'done' | 'missed' {
  return value === 'partial' || value === 'done' || value === 'missed';
}
