import {
  asArray,
  asInteger,
  asRecord,
  badRequest,
  fetchDraft,
  jsonResponse,
  parseJsonBody,
  requireUser,
  safeJsonParse,
  unauthorized,
  notFound,
  type Env,
} from '../../../_shared/lesson-drafts/_shared';
import {
  buildSnapshot,
  commitDraftStep,
  ensureDraftVersionMatch,
  handleCommitError,
} from '../../../_shared/lesson-drafts/_commit';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireUser(ctx);
    if (!user) return unauthorized();

    const draftId = ctx.params?.draftId;
    const normalizedDraftId = (Array.isArray(draftId) ? draftId[0] : draftId) ?? null;
    if (!normalizedDraftId) return notFound('Draft not found');

    const body = asRecord(await parseJsonBody(ctx));
    if (!body) return badRequest('Invalid JSON body');

    const draftVersion = asInteger(body.draft_version ?? body.draftVersion);
    if (draftVersion == null) return badRequest('draft_version is required');

    const draftRow = await fetchDraft(ctx.env.DB, normalizedDraftId, user.id);
    if (!draftRow) return notFound('Draft not found');

    const versionError = ensureDraftVersionMatch(draftRow, draftVersion);
    if (versionError) return versionError;

    const draftJson = safeJsonParse(draftRow.draft_json) ?? {};

    let lessonId = draftRow.lesson_id ?? null;

    const steps: Array<{ step: Parameters<typeof commitDraftStep>[0]['step']; shouldRun: boolean }> = [
      { step: 'meta', shouldRun: true },
      { step: 'units', shouldRun: asArray(draftJson.units).length > 0 },
      { step: 'sentences', shouldRun: asArray(draftJson.sentences).length > 0 },
      {
        step: 'comprehension',
        shouldRun: !!(draftJson.comprehension &&
          (asArray((draftJson.comprehension as any).mcqs).length > 0 ||
            asArray((draftJson.comprehension as any).reflective).length > 0 ||
            asArray((draftJson.comprehension as any).analytical).length > 0 ||
            asArray((draftJson.comprehension as any).Mcqs).length > 0)),
      },
      { step: 'notes', shouldRun: asArray(draftJson.notes).length > 0 },
    ];

    for (const entry of steps) {
      if (!entry.shouldRun) continue;
      const result = await commitDraftStep({
        env: ctx.env,
        userId: user.id,
        draftRow: { ...draftRow, lesson_id: lessonId },
        step: entry.step,
      });
      lessonId = result.lessonId;
    }

    if (!lessonId) {
      return badRequest('Lesson id missing; commit meta step first.');
    }

    const publishedAt = new Date().toISOString();
    const snapshot = buildSnapshot(draftJson, {
      comprehension: true,
      units: true,
      sentences: true,
      notes: true,
      publishedAt,
    });
    if (snapshot.meta && typeof snapshot.meta === 'object') {
      (snapshot.meta as Record<string, unknown>)['lesson_type'] = draftRow.lesson_type;
    }

    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        `UPDATE ar_lessons SET status = 'published', lesson_json = ?1, updated_at = datetime('now') WHERE id = ?2`
      ).bind(JSON.stringify(snapshot), lessonId),
      ctx.env.DB.prepare(
        `UPDATE ar_lesson_drafts SET status = 'published', updated_at = datetime('now') WHERE draft_id = ?1`
      ).bind(normalizedDraftId),
    ]);

    return jsonResponse({ ok: true, lesson_id: lessonId, status: 'published' });
  } catch (err) {
    return handleCommitError(err);
  }
};
