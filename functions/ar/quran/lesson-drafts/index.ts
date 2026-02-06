import {
  asInteger,
  asRecord,
  asString,
  buildInitialDraft,
  jsonResponse,
  parseJsonBody,
  requireUser,
  unauthorized,
  badRequest,
  type Env,
} from '../../_shared/lesson-drafts/_shared';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireUser(ctx);
    if (!user) return unauthorized();

    const body = asRecord(await parseJsonBody(ctx));
    if (!body) return badRequest('Invalid JSON body');

    const lessonId = asInteger(body.lesson_id ?? body.lessonId);
    if (lessonId != null) {
      const lessonRow = (await ctx.env.DB.prepare(
        `SELECT id, user_id FROM ar_lessons WHERE id = ?1`
      )
        .bind(lessonId)
        .first()) as { id?: number; user_id?: number | null } | null;

      if (!lessonRow?.id) {
        return badRequest('lesson_id not found');
      }
      if (lessonRow.user_id && lessonRow.user_id !== user.id && user.role !== 'admin') {
        return unauthorized();
      }
    }

    const subtype = asString(body.subtype) ?? null;
    const source = asString(body.source) ?? null;
    const initialReference = asRecord(body.initial_reference ?? body.initialReference) ?? null;

    const draftId = crypto.randomUUID();
    const draftJson = buildInitialDraft({
      lessonType: 'quran',
      subtype,
      source,
      initialReference,
    });

    const activeStep = asString(body.active_step ?? body.activeStep) ?? 'meta';

    await ctx.env.DB.prepare(
      `
        INSERT INTO ar_lesson_drafts (
          draft_id, lesson_id, user_id, lesson_type,
          status, active_step, draft_version, draft_json
        ) VALUES (?1, ?2, ?3, 'quran', 'draft', ?4, 1, ?5)
      `
    )
      .bind(draftId, lessonId, user.id, activeStep, JSON.stringify(draftJson))
      .run();

    return jsonResponse({
      ok: true,
      draft_id: draftId,
      draft_version: 1,
      draft_json: draftJson,
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message ?? String(err) }, 500);
  }
};
