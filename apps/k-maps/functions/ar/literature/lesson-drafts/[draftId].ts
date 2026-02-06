import {
  asRecord,
  asString,
  fetchDraft,
  jsonResponse,
  parseJsonBody,
  requireUser,
  unauthorized,
  badRequest,
  notFound,
  type Env,
} from '../../_shared/lesson-drafts/_shared';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireUser(ctx);
    if (!user) return unauthorized();

    const draftId = ctx.params?.draftId;
    const normalizedDraftId = (Array.isArray(draftId) ? draftId[0] : draftId) ?? null;
    if (!normalizedDraftId) return notFound('Draft not found');

    const draftRow = await fetchDraft(ctx.env.DB, normalizedDraftId, user.id);
    if (!draftRow) return notFound('Draft not found');

    const draftJson = JSON.parse(draftRow.draft_json);

    return jsonResponse({
      ok: true,
      draft_id: draftRow.draft_id,
      lesson_id: draftRow.lesson_id,
      draft_version: draftRow.draft_version,
      status: draftRow.status,
      active_step: draftRow.active_step,
      draft_json: draftJson,
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message ?? String(err) }, 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireUser(ctx);
    if (!user) return unauthorized();

    const draftId = ctx.params?.draftId;
    const normalizedDraftId = (Array.isArray(draftId) ? draftId[0] : draftId) ?? null;
    if (!normalizedDraftId) return notFound('Draft not found');

    const body = asRecord(await parseJsonBody(ctx));
    if (!body) return badRequest('Invalid JSON body');

    const draftJson = asRecord(body.draft_json ?? body.draftJson);
    if (!draftJson) return badRequest('draft_json must be an object');

    const activeStep = asString(body.active_step ?? body.activeStep) ?? null;

    await ctx.env.DB.prepare(
      `
        UPDATE ar_lesson_drafts
        SET draft_json = ?1,
            active_step = ?2,
            draft_version = draft_version + 1,
            updated_at = datetime('now')
        WHERE draft_id = ?3 AND user_id = ?4
      `
    )
      .bind(JSON.stringify(draftJson), activeStep, normalizedDraftId, user.id)
      .run();

    const row = (await ctx.env.DB.prepare(
      `SELECT draft_version FROM ar_lesson_drafts WHERE draft_id = ?1 AND user_id = ?2`
    )
      .bind(normalizedDraftId, user.id)
      .first()) as { draft_version?: number } | null;

    if (!row) return notFound('Draft not found');

    return jsonResponse({
      ok: true,
      draft_version: row?.draft_version ?? null,
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message ?? String(err) }, 500);
  }
};
