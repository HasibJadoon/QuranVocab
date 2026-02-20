import type { D1Database, PagesFunction } from '@cloudflare/workers-types';
import { requireAuth } from '../_utils/auth';
import {
  NOTE_COLUMNS,
  json,
  listStatus,
  mapNoteRow,
  parseBody,
  parseStatus,
  readOptionalTitle,
  readString,
} from '../_utils/notes';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireAuth(ctx);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const url = new URL(ctx.request.url);
    const status = listStatus(url.searchParams.get('status'));
    const query = (url.searchParams.get('q') ?? '').trim();

    if (query) {
      const like = `%${query}%`;
      const { results = [] } = await ctx.env.DB
        .prepare(
          `
          SELECT ${NOTE_COLUMNS}
          FROM ar_capture_notes
          WHERE user_id = ?1
            AND status = ?2
            AND (body_md LIKE ?3 OR COALESCE(title, '') LIKE ?3)
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 400
          `
        )
        .bind(user.id, status, like)
        .all<Record<string, unknown>>();

      return json({ ok: true, notes: results.map(mapNoteRow) });
    }

    const { results = [] } = await ctx.env.DB
      .prepare(
        `
        SELECT ${NOTE_COLUMNS}
        FROM ar_capture_notes
        WHERE user_id = ?1
          AND status = ?2
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 400
        `
      )
      .bind(user.id, status)
      .all<Record<string, unknown>>();

    return json({ ok: true, notes: results.map(mapNoteRow) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list notes.';
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

    const bodyMarkdown = readString(body['body_md']);
    if (bodyMarkdown === null) {
      return json({ ok: false, error: 'body_md must be a string.' }, 400);
    }

    const statusInput = body['status'];
    const status = statusInput === undefined ? 'inbox' : parseStatus(statusInput);
    if (!status) {
      return json({ ok: false, error: 'status must be inbox or archived.' }, 400);
    }

    const noteId = crypto.randomUUID();
    const title = readOptionalTitle(body['title']);

    await ctx.env.DB
      .prepare(
        `
        INSERT INTO ar_capture_notes (id, user_id, status, body_md, title, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
        `
      )
      .bind(noteId, user.id, status, bodyMarkdown, title)
      .run();

    const row = await ctx.env.DB
      .prepare(`SELECT ${NOTE_COLUMNS} FROM ar_capture_notes WHERE id = ?1 AND user_id = ?2 LIMIT 1`)
      .bind(noteId, user.id)
      .first<Record<string, unknown>>();

    if (!row) {
      return json({ ok: false, error: 'Failed to create note.' }, 500);
    }

    return json({ ok: true, note: mapNoteRow(row) }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create note.';
    return json({ ok: false, error: message }, 500);
  }
};
