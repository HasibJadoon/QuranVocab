import { CaptureNoteMeta } from '../models/sprint.models';

const META_RE = /^\s*<!--meta:(\{[\s\S]*?\})-->\s*/;

export type ParsedCaptureBody = {
  meta: CaptureNoteMeta | null;
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readTrimmed(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) {
    return null;
  }
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

function isCaptureSource(value: string): value is CaptureNoteMeta['source'] {
  return value === 'weekly' || value === 'lesson' || value === 'podcast';
}

export function composeCaptureBody(meta: CaptureNoteMeta, text: string): string {
  const normalizedText = text.replace(/^\s+/, '');
  return `<!--meta:${JSON.stringify(meta)}-->\n${normalizedText}`;
}

export function parseCaptureMeta(bodyMd: string): ParsedCaptureBody {
  const content = bodyMd ?? '';
  const match = content.match(META_RE);
  if (!match) {
    return {
      meta: null,
      text: content.trim(),
    };
  }

  const metaRaw = match[1];
  const text = content.slice(match[0].length).trim();
  try {
    const parsed = JSON.parse(metaRaw) as unknown;
    const record = asRecord(parsed);
    if (!record) {
      return { meta: null, text };
    }

    const source = readTrimmed(record['source']);
    const weekStart = readTrimmed(record['week_start']);
    if (!source || !weekStart || !isCaptureSource(source)) {
      return { meta: null, text };
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
      text,
    };
  } catch {
    return {
      meta: null,
      text,
    };
  }
}
