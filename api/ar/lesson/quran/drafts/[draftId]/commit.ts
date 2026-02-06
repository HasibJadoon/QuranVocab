import {
  fetchDraft,
  jsonResponse,
  requireUser,
  unauthorized,
  notFound,
  type Env,
} from '../../../../lesson-drafts/_shared';
import {
  commitDraftStep,
  ensureDraftVersionMatch,
  handleCommitError,
  handleCommitRequest,
} from '../../../../lesson-drafts/_commit';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await requireUser(ctx);
    if (!user) return unauthorized();

    const draftId = ctx.params?.draftId;
    const normalizedDraftId = (Array.isArray(draftId) ? draftId[0] : draftId) ?? null;
    if (!normalizedDraftId) return notFound('Draft not found');

    const parsed = await handleCommitRequest(ctx);
    if (parsed instanceof Response) return parsed;

    const draftRow = await fetchDraft(ctx.env.DB, normalizedDraftId, user.id);
    if (!draftRow) return notFound('Draft not found');

    const versionError = ensureDraftVersionMatch(draftRow, parsed.draftVersion);
    if (versionError) return versionError;

    const result = await commitDraftStep({
      env: ctx.env,
      userId: user.id,
      draftRow,
      step: parsed.step,
    });

    return jsonResponse({
      ok: true,
      lesson_id: result.lessonId,
      committed_step: parsed.step,
      result_counts: result.counts,
    });
  } catch (err) {
    return handleCommitError(err);
  }
};
