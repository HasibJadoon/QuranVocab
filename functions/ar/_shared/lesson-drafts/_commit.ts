import { Canon, canonicalize, sha256Hex } from '../../../_utils/universal';
import {
  asArray,
  asInteger,
  asRecord,
  asString,
  badRequest,
  conflict,
  jsonResponse,
  safeJsonParse,
  type DraftRow,
  type Env,
  type JsonRecord,
} from './_shared';

const commitSteps = ['meta', 'units', 'sentences', 'comprehension', 'notes'] as const;
export type CommitStep = (typeof commitSteps)[number];

class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function parseCommitStep(value: unknown): CommitStep | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  for (const step of commitSteps) {
    if (step === raw) return step;
  }
  return null;
}

function normalizeText(value: string) {
  return canonicalize(value).replace(/\s+/g, ' ').trim();
}

export function buildSnapshot(draft: JsonRecord, include: {
  comprehension?: boolean;
  units?: boolean;
  sentences?: boolean;
  notes?: boolean;
  publishedAt?: string | null;
}) {
  const meta = asRecord(draft.meta) ?? {};
  const reference = asRecord(draft.reference) ?? {};

  const snapshot: JsonRecord = {
    schema_version: draft.schema_version ?? 1,
    meta: {
      title: asString(meta.title) ?? '',
      title_ar: asString(meta.title_ar) ?? null,
      lesson_type: asString(meta.lesson_type) ?? null,
      subtype: asString(meta.subtype) ?? null,
      difficulty: asInteger(meta.difficulty),
      source: asString(meta.source) ?? null,
    },
    reference: {
      container_id: asString(reference.container_id) ?? asString(reference.containerId) ?? null,
      unit_id: asString(reference.unit_id) ?? asString(reference.unitId) ?? null,
      surah: asInteger(reference.surah),
      ayah_from: asInteger(reference.ayah_from ?? reference.ayahFrom),
      ayah_to: asInteger(reference.ayah_to ?? reference.ayahTo),
    },
  };

  if (include.units) {
    snapshot.units = asArray(draft.units);
  }
  if (include.sentences) {
    snapshot.sentences = asArray(draft.sentences);
  }
  if (include.comprehension) {
    snapshot.comprehension = asRecord(draft.comprehension) ?? {
      mcqs: [],
      reflective: [],
      analytical: [],
    };
  }
  if (include.notes) {
    snapshot.notes = asArray(draft.notes);
  }
  if (include.publishedAt) {
    snapshot.published_at = include.publishedAt;
  }

  return snapshot;
}

type NormalizedMeta = {
  title: string;
  titleAr: string | null;
  lessonType: string;
  subtype: string | null;
  source: string | null;
  difficulty: number | null;
  containerId: string | null;
  unitId: string | null;
};

function normalizeMeta(draft: JsonRecord, fallbackLessonType: string): NormalizedMeta {
  const meta = asRecord(draft.meta) ?? {};
  const reference = asRecord(draft.reference) ?? {};
  return {
    title: asString(meta.title) ?? '',
    titleAr: asString(meta.title_ar) ?? null,
    lessonType: asString(meta.lesson_type) ?? fallbackLessonType,
    subtype: asString(meta.subtype) ?? null,
    source: asString(meta.source) ?? null,
    difficulty: asInteger(meta.difficulty),
    containerId: asString(reference.container_id) ?? asString(reference.containerId) ?? null,
    unitId: asString(reference.unit_id) ?? asString(reference.unitId) ?? null,
  };
}

type NormalizedUnit = {
  unitId: string;
  orderIndex: number;
  role: string | null;
  note: string | null;
};

function normalizeUnits(draft: JsonRecord): NormalizedUnit[] {
  const units = asArray(draft.units);
  return units
    .map((item, index) => {
      const rec = asRecord(item) ?? {};
      const unitId = asString(rec.unit_id) ?? asString(rec.unitId);
      if (!unitId) return null;
      const orderIndex = asInteger(rec.order_index ?? rec.orderIndex) ?? index;
      return {
        unitId,
        orderIndex,
        role: asString(rec.role) ?? null,
        note: asString(rec.note) ?? null,
      };
    })
    .filter((item): item is NormalizedUnit => !!item);
}

type NormalizedSentence = {
  unitId: string;
  sentenceOrder: number;
  textAr: string;
  translation: string | null;
  notes: string | null;
  sentenceKind: string;
  sequence: string[];
};

function normalizeSentences(draft: JsonRecord): NormalizedSentence[] {
  const sentences = asArray(draft.sentences);
  return sentences
    .map((item, index) => {
      const rec = asRecord(item) ?? {};
      const unitId = asString(rec.unit_id) ?? asString(rec.unitId);
      const textAr = asString(rec.text_ar) ?? asString(rec.textAr);
      if (!unitId || !textAr) return null;
      const sentenceOrder = asInteger(rec.sentence_order ?? rec.sentenceOrder) ?? index;
      const sequence = asArray(rec.sequence_json ?? rec.sequence ?? [])
        .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
        .filter((entry) => entry);
      const fallbackSequence = sequence.length ? sequence : [normalizeText(textAr)];
      return {
        unitId,
        sentenceOrder,
        textAr,
        translation: asString(rec.translation) ?? null,
        notes: asString(rec.notes) ?? null,
        sentenceKind: asString(rec.sentence_kind) ?? asString(rec.kind) ?? 'default',
        sequence: fallbackSequence,
      };
    })
    .filter((item): item is NormalizedSentence => !!item);
}

type NormalizedComprehension = {
  mcqs: JsonRecord[];
  reflective: JsonRecord[];
  analytical: JsonRecord[];
};

function normalizeComprehension(draft: JsonRecord): NormalizedComprehension {
  const comp = asRecord(draft.comprehension) ?? {};
  const mcqs = asArray(comp.mcqs ?? comp.Mcqs).map((item) => (asRecord(item) ?? {}));
  const reflective = asArray(comp.reflective ?? comp.reflections).map((item) => (asRecord(item) ?? {}));
  const analytical = asArray(comp.analytical ?? comp.analysis).map((item) => (asRecord(item) ?? {}));
  return { mcqs, reflective, analytical };
}

type NormalizedNote = {
  noteKeySeed: string;
  noteType: string;
  title: string | null;
  excerpt: string;
  commentary: string | null;
  locator: string | null;
  sourceId: number | null;
  targetType: string;
  targetId: string;
  relation: string;
  containerId: string | null;
  unitId: string | null;
  sentenceOrder: number | null;
  ref: string | null;
  extra: JsonRecord | null;
};

function normalizeNotes(draft: JsonRecord, lessonId: number): NormalizedNote[] {
  const notes = asArray(draft.notes);
  return notes
    .map((item, index) => {
      const rec = asRecord(item) ?? {};
      const excerpt =
        asString(rec.excerpt) ?? asString(rec.note) ?? asString(rec.text) ?? asString(rec.body);
      if (!excerpt) return null;

      const noteUid = asString(rec.id) ?? asString(rec.note_id) ?? `${index + 1}`;
      const noteKeySeed = `note|${lessonId}|${noteUid}`;
      const noteType = asString(rec.note_type ?? rec.noteType) ?? 'lesson_note';

      const targetRec = asRecord(rec.target) ?? {};
      const targetType =
        asString(rec.target_type ?? rec.targetType) ?? asString(targetRec.type) ?? 'lesson';

      const targetIdInput =
        asString(rec.target_id ?? rec.targetId) ??
        asString(targetRec.target_id ?? targetRec.targetId) ??
        null;

      const relation = asString(rec.relation) ?? asString(targetRec.relation) ?? 'about';
      const containerId = asString(targetRec.container_id ?? targetRec.containerId) ?? null;
      const unitId = asString(targetRec.unit_id ?? targetRec.unitId) ?? null;
      const sentenceOrder =
        asInteger(targetRec.sentence_order ?? targetRec.sentenceOrder) ?? null;
      const ref = asString(targetRec.ref) ?? null;

      let targetId = targetIdInput ?? '';
      if (!targetId) {
        if (targetType === 'lesson') {
          targetId = `lesson:${lessonId}`;
        } else if (targetType === 'unit' && unitId) {
          targetId = `unit:${unitId}`;
        }
      }

      if (!targetId) return null;

      const sourceId = asInteger(rec.source_id ?? rec.sourceId) ?? null;
      const extra = asRecord(rec.extra) ?? null;

      return {
        noteKeySeed,
        noteType,
        title: asString(rec.title) ?? null,
        excerpt,
        commentary: asString(rec.commentary) ?? null,
        locator: asString(rec.locator) ?? null,
        sourceId,
        targetType,
        targetId,
        relation,
        containerId,
        unitId,
        sentenceOrder,
        ref,
        extra,
      };
    })
    .filter((item): item is NormalizedNote => !!item);
}

function buildInClause(count: number, startIndex = 1) {
  const slots = Array.from({ length: count }, (_, idx) => `?${idx + startIndex}`);
  return slots.join(', ');
}

function noteIdFromKey(hash: string) {
  const slice = hash.slice(0, 12);
  const parsed = Number.parseInt(slice, 16);
  if (!Number.isFinite(parsed) || parsed <= 0) return -1;
  return -Math.abs(parsed);
}

function validateMeta(meta: NormalizedMeta) {
  if (!meta.title) return 'Meta step requires a non-empty title.';
  if (!meta.lessonType) return 'Meta step requires lesson_type.';
  if (meta.lessonType === 'quran' && (!meta.containerId || !meta.unitId)) {
    return 'Meta step requires container_id and unit_id.';
  }
  return null;
}

function validateUnits(units: NormalizedUnit[], containerId: string | null) {
  if (!containerId) return 'Units step requires container_id.';
  if (!units.length) return 'Units step requires at least one unit.';
  for (const unit of units) {
    if (!unit.unitId) return 'Units step requires unit_id on every unit.';
    if (!Number.isFinite(unit.orderIndex) || unit.orderIndex < 0) {
      return 'Units step requires non-negative order_index.';
    }
  }
  return null;
}

function validateSentences(sentences: NormalizedSentence[], containerId: string | null) {
  if (!containerId) return 'Sentences step requires container_id.';
  if (!sentences.length) return 'Sentences step requires at least one sentence.';
  for (const sentence of sentences) {
    if (!sentence.unitId) return 'Sentences step requires unit_id on every sentence.';
    if (!sentence.textAr) return 'Sentences step requires text_ar.';
    if (!Number.isFinite(sentence.sentenceOrder)) return 'Sentences step requires sentence_order.';
  }
  return null;
}

function validateComprehension(comp: NormalizedComprehension) {
  const hasContent = comp.mcqs.length || comp.reflective.length || comp.analytical.length;
  if (!hasContent) return 'Comprehension step requires at least one item.';

  for (const mcq of comp.mcqs) {
    const question = asString(mcq.question);
    const options = asArray(mcq.options);
    const correctId = asString(mcq.correct_option_id ?? mcq.correctOptionId);
    if (!question) return 'MCQ requires a question.';
    if (options.length < 2) return 'MCQ requires at least two options.';
    if (!correctId) return 'MCQ requires correct_option_id.';
    const optionMatch = options.some((option) => asString(asRecord(option)?.id) === correctId);
    if (!optionMatch) return 'MCQ correct_option_id must match an option.';
  }

  return null;
}

function validateNotes(notes: NormalizedNote[]) {
  if (!notes.length) return 'Notes step requires at least one note.';
  for (const note of notes) {
    if (!note.excerpt) return 'Notes step requires excerpt.';
    if (!note.targetId) return 'Notes step requires target_id.';
  }
  return null;
}

async function ensureUnitsBelongToContainer(
  db: D1Database,
  containerId: string,
  unitIds: string[]
) {
  if (!unitIds.length) return;
  const unique = Array.from(new Set(unitIds));
  const clause = buildInClause(unique.length, 2);
  const stmt = db
    .prepare(`SELECT COUNT(*) as total FROM ar_container_units WHERE container_id = ?1 AND id IN (${clause})`)
    .bind(containerId, ...unique);
  const row = (await stmt.first()) as { total?: number } | null;
  const total = Number(row?.total ?? 0);
  if (total !== unique.length) {
    throw new HttpError(400, 'Units do not belong to container.');
  }
}

async function resolveSentenceTargetId(db: D1Database, containerId: string, unitId: string, order: number) {
  const row = (await db
    .prepare(
      `
        SELECT ar_sentence_occ_id
        FROM ar_occ_sentence
        WHERE container_id = ?1 AND unit_id = ?2 AND sentence_order = ?3
        LIMIT 1
      `
    )
    .bind(containerId, unitId, order)
    .first()) as { ar_sentence_occ_id?: string } | null;
  return row?.ar_sentence_occ_id ?? null;
}

export async function commitDraftStep(args: {
  env: Env;
  userId: number;
  draftRow: DraftRow;
  step: CommitStep;
}) {
  const { env, userId, draftRow, step } = args;
  const db = env.DB;

  const existingCommit = (await db
    .prepare(
      `
        SELECT id, lesson_id, result_json, error
        FROM ar_lesson_commits
        WHERE draft_id = ?1 AND step = ?2 AND draft_version = ?3
      `
    )
    .bind(draftRow.draft_id, step, draftRow.draft_version)
    .first()) as { id?: number; lesson_id?: number; result_json?: string; error?: string } | null;

  if (existingCommit && !existingCommit.error) {
    const resultJson = safeJsonParse(existingCommit.result_json ?? null) ?? {};
    const lessonId = existingCommit.lesson_id ?? draftRow.lesson_id ?? null;
    if (!lessonId) {
      throw new HttpError(409, 'Lesson not initialized. Commit meta step first.');
    }
    return { lessonId, counts: resultJson, alreadyCommitted: true };
  }

  const draftJson = safeJsonParse(draftRow.draft_json) ?? {};
  const meta = normalizeMeta(draftJson, draftRow.lesson_type);
  const units = normalizeUnits(draftJson);
  const sentences = normalizeSentences(draftJson);
  const comprehension = normalizeComprehension(draftJson);
  const containerId = meta.containerId;
  const unitId = meta.unitId;

  const statements: D1PreparedStatement[] = [];
  const counts: Record<string, number> = {};

  if (step === 'meta') {
    const error = validateMeta(meta);
    if (error) throw new HttpError(400, error);

    const snapshot = buildSnapshot(draftJson, {
      comprehension: false,
      units: false,
      sentences: false,
      notes: false,
    });
    if (snapshot.meta && typeof snapshot.meta === 'object') {
      (snapshot.meta as JsonRecord)['lesson_type'] = meta.lessonType;
    }

    if (draftRow.lesson_id) {
      statements.push(
        db
          .prepare(
            `
              UPDATE ar_lessons
              SET title = ?1,
                  title_ar = ?2,
                  lesson_type = ?3,
                  subtype = ?4,
                  source = ?5,
                  status = ?6,
                  difficulty = ?7,
                  container_id = ?8,
                  unit_id = ?9,
                  lesson_json = ?10,
                  updated_at = datetime('now')
              WHERE id = ?11
            `
          )
          .bind(
            meta.title,
            meta.titleAr,
            meta.lessonType,
            meta.subtype,
            meta.source,
            'draft',
            meta.difficulty,
            meta.containerId,
            meta.unitId,
            JSON.stringify(snapshot),
            draftRow.lesson_id
          )
      );
    } else {
      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_lessons (
                user_id, container_id, unit_id, title, title_ar,
                lesson_type, subtype, status, difficulty, source, lesson_json
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            `
          )
          .bind(
            userId,
            meta.containerId,
            meta.unitId,
            meta.title,
            meta.titleAr,
            meta.lessonType,
            meta.subtype,
            'draft',
            meta.difficulty,
            meta.source,
            JSON.stringify(snapshot)
          )
      );
      statements.push(
        db
          .prepare(
            `
              UPDATE ar_lesson_drafts
              SET lesson_id = last_insert_rowid(),
                  updated_at = datetime('now')
              WHERE draft_id = ?1
            `
          )
          .bind(draftRow.draft_id)
      );
    }

    counts.lessons = 1;
  }

  if (step === 'units') {
    const error = validateUnits(units, containerId);
    if (error) throw new HttpError(400, error);
    if (!draftRow.lesson_id) throw new HttpError(409, 'Meta step must be committed first.');
    await ensureUnitsBelongToContainer(db, containerId!, units.map((unit) => unit.unitId));

    statements.push(
      db
        .prepare(`UPDATE ar_lessons SET container_id = ?1, unit_id = ?2, updated_at = datetime('now') WHERE id = ?3`)
        .bind(containerId, unitId, draftRow.lesson_id)
    );

    statements.push(
      db.prepare(`DELETE FROM ar_lesson_unit_link WHERE lesson_id = ?1`).bind(draftRow.lesson_id)
    );

    if (containerId) {
      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_lesson_unit_link (
                lesson_id, container_id, unit_id, order_index, link_scope, role, note
              ) VALUES (?1, ?2, '', 0, 'container', NULL, NULL)
            `
          )
          .bind(draftRow.lesson_id, containerId)
      );
    }

    for (const unit of units) {
      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_lesson_unit_link (
                lesson_id, container_id, unit_id, order_index, link_scope, role, note
              ) VALUES (?1, ?2, ?3, ?4, 'unit', ?5, ?6)
            `
          )
          .bind(draftRow.lesson_id, containerId, unit.unitId, unit.orderIndex, unit.role, unit.note)
      );
    }

    counts.container_links = containerId ? 1 : 0;
    counts.unit_links = units.length;
  }

  if (step === 'sentences') {
    const error = validateSentences(sentences, containerId);
    if (error) throw new HttpError(400, error);
    if (!draftRow.lesson_id) throw new HttpError(409, 'Meta step must be committed first.');

    const oldLinks = (await db
      .prepare(
        `SELECT ar_sentence_occ_id FROM ar_lesson_sentence_link WHERE lesson_id = ?1`
      )
      .bind(draftRow.lesson_id)
      .all()) as { results?: Array<{ ar_sentence_occ_id?: string }> } | null;
    const oldIds = (oldLinks?.results ?? [])
      .map((row) => row.ar_sentence_occ_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    statements.push(
      db
        .prepare(`DELETE FROM ar_lesson_sentence_link WHERE lesson_id = ?1`)
        .bind(draftRow.lesson_id)
    );

    for (const sentence of sentences) {
      const canonical = Canon.sentence({ kind: sentence.sentenceKind, sequence: sentence.sequence });
      const canonicalInput = canonicalize(canonical);
      const arUSentence = await sha256Hex(canonicalInput);
      const sequenceJson = JSON.stringify(sentence.sequence);

      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_u_sentences (
                ar_u_sentence, canonical_input,
                sentence_kind, sequence_json, text_ar,
                meta_json
              ) VALUES (?1, ?2, ?3, ?4, ?5, NULL)
              ON CONFLICT(ar_u_sentence) DO UPDATE SET
                sentence_kind = excluded.sentence_kind,
                sequence_json = excluded.sequence_json,
                text_ar = excluded.text_ar,
                updated_at = datetime('now')
            `
          )
          .bind(arUSentence, canonicalInput, sentence.sentenceKind, sequenceJson, sentence.textAr)
      );

      const textNorm = normalizeText(sentence.textAr);
      const occSeed = `occ_sentence|${containerId}|${sentence.unitId}|${sentence.sentenceOrder}|${textNorm}`;
      const occId = await sha256Hex(occSeed);

      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_occ_sentence (
                ar_sentence_occ_id, user_id,
                container_id, unit_id,
                sentence_order, text_ar, translation, notes,
                ar_u_sentence
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
              ON CONFLICT(container_id, unit_id, sentence_order) DO UPDATE SET
                ar_sentence_occ_id = excluded.ar_sentence_occ_id,
                text_ar = excluded.text_ar,
                translation = excluded.translation,
                notes = excluded.notes,
                ar_u_sentence = excluded.ar_u_sentence,
                updated_at = datetime('now')
            `
          )
          .bind(
            occId,
            userId,
            containerId,
            sentence.unitId,
            sentence.sentenceOrder,
            sentence.textAr,
            sentence.translation,
            sentence.notes,
            arUSentence
          )
      );

      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_lesson_sentence_link (
                lesson_id, ar_sentence_occ_id, unit_id, sentence_order
              ) VALUES (?1, ?2, ?3, ?4)
            `
          )
          .bind(draftRow.lesson_id, occId, sentence.unitId, sentence.sentenceOrder)
      );
    }

    if (oldIds.length) {
      const clause = buildInClause(oldIds.length, 1);
      statements.push(
        db
          .prepare(
            `
              DELETE FROM ar_occ_sentence
              WHERE ar_sentence_occ_id IN (${clause})
                AND NOT EXISTS (
                  SELECT 1
                  FROM ar_lesson_sentence_link AS l
                  WHERE l.ar_sentence_occ_id = ar_occ_sentence.ar_sentence_occ_id
                )
            `
          )
          .bind(...oldIds)
      );
    }

    counts.u_sentences = sentences.length;
    counts.occ_sentences = sentences.length;
    counts.sentence_links = sentences.length;
  }

  if (step === 'comprehension') {
    const error = validateComprehension(comprehension);
    if (error) throw new HttpError(400, error);
    if (!draftRow.lesson_id) throw new HttpError(409, 'Meta step must be committed first.');

    const snapshot = buildSnapshot(draftJson, {
      comprehension: true,
      units: false,
      sentences: false,
      notes: false,
    });
    if (snapshot.meta && typeof snapshot.meta === 'object') {
      (snapshot.meta as JsonRecord)['lesson_type'] = meta.lessonType;
    }

    statements.push(
      db
        .prepare(`UPDATE ar_lessons SET lesson_json = ?1, updated_at = datetime('now') WHERE id = ?2`)
        .bind(JSON.stringify(snapshot), draftRow.lesson_id)
    );

    counts.comprehension_items =
      comprehension.mcqs.length + comprehension.reflective.length + comprehension.analytical.length;
  }

  if (step === 'notes') {
    if (!draftRow.lesson_id) throw new HttpError(409, 'Meta step must be committed first.');
    const notes = normalizeNotes(draftJson, draftRow.lesson_id);
    const error = validateNotes(notes);
    if (error) throw new HttpError(400, error);

    statements.push(
      db
        .prepare(
          `DELETE FROM ar_note_targets WHERE json_extract(extra_json, '$.lesson_id') = ?1`
        )
        .bind(draftRow.lesson_id)
    );

    for (const note of notes) {
      let targetId = note.targetId;
      let unitIdValue = note.unitId;
      const containerValue = note.containerId ?? containerId;
      if (note.targetType === 'sentence') {
        const hasExplicitTarget = targetId.startsWith('sentence:');
        if (!hasExplicitTarget || note.sentenceOrder != null || note.ref) {
          if (!containerValue || !unitIdValue) {
            throw new HttpError(400, 'Sentence notes require container_id and unit_id.');
          }
          const orderValue = note.sentenceOrder ?? (note.ref ? Number.parseInt(note.ref, 10) : NaN);
          const sentenceOrder = Number.isFinite(orderValue) ? orderValue : null;
          if (sentenceOrder == null) {
            throw new HttpError(400, 'Sentence notes require sentence_order.');
          }
          const occId = await resolveSentenceTargetId(db, containerValue, unitIdValue, sentenceOrder);
          if (!occId) {
            throw new HttpError(400, 'Sentence occurrence not found for note target.');
          }
          targetId = `sentence:${occId}`;
        }
      }

      const noteKey = await sha256Hex(note.noteKeySeed);
      const noteId = noteIdFromKey(noteKey);
      const extraJson = JSON.stringify({
        lesson_id: draftRow.lesson_id,
        note_key: noteKey,
        draft_id: draftRow.draft_id,
        meta: note.extra ?? null,
      });

      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_notes (
                id, user_id, note_type, title, excerpt, commentary,
                source_id, locator, extra_json
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
              ON CONFLICT(id) DO UPDATE SET
                note_type = excluded.note_type,
                title = excluded.title,
                excerpt = excluded.excerpt,
                commentary = excluded.commentary,
                source_id = excluded.source_id,
                locator = excluded.locator,
                extra_json = excluded.extra_json,
                updated_at = datetime('now')
            `
          )
          .bind(
            noteId,
            userId,
            note.noteType,
            note.title,
            note.excerpt,
            note.commentary,
            note.sourceId,
            note.locator,
            extraJson
          )
      );

      statements.push(
        db
          .prepare(
            `
              INSERT INTO ar_note_targets (
                note_id, target_type, target_id,
                relation, share_scope, edge_note,
                container_id, unit_id, ref, extra_json
              ) VALUES (?1, ?2, ?3, ?4, 'private', NULL, ?5, ?6, ?7, ?8)
              ON CONFLICT(note_id, target_type, target_id) DO UPDATE SET
                relation = excluded.relation,
                container_id = excluded.container_id,
                unit_id = excluded.unit_id,
                ref = excluded.ref,
                extra_json = excluded.extra_json
            `
          )
          .bind(
            noteId,
            note.targetType,
            targetId,
            note.relation,
            containerValue,
            unitIdValue,
            note.ref,
            JSON.stringify({ lesson_id: draftRow.lesson_id })
          )
      );
    }

    counts.notes = notes.length;
    counts.note_targets = notes.length;
  }

  const lessonIdForCommit = draftRow.lesson_id;
  const resultJson = JSON.stringify(counts);

  if (step === 'meta' && !draftRow.lesson_id) {
    statements.push(
      db
        .prepare(
          `
            INSERT INTO ar_lesson_commits (
              draft_id, lesson_id, user_id, step, draft_version, result_json
            ) VALUES (?1, last_insert_rowid(), ?2, ?3, ?4, ?5)
            ON CONFLICT(draft_id, step, draft_version) DO UPDATE SET
              lesson_id = excluded.lesson_id,
              user_id = excluded.user_id,
              result_json = excluded.result_json,
              error = NULL,
              created_at = datetime('now')
          `
        )
        .bind(draftRow.draft_id, userId, step, draftRow.draft_version, resultJson)
    );
  } else if (lessonIdForCommit) {
    statements.push(
      db
        .prepare(
          `
            INSERT INTO ar_lesson_commits (
              draft_id, lesson_id, user_id, step, draft_version, result_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(draft_id, step, draft_version) DO UPDATE SET
              lesson_id = excluded.lesson_id,
              user_id = excluded.user_id,
              result_json = excluded.result_json,
              error = NULL,
              created_at = datetime('now')
          `
        )
        .bind(draftRow.draft_id, lessonIdForCommit, userId, step, draftRow.draft_version, resultJson)
    );
  }

  if (!statements.length) {
    throw new HttpError(400, 'No statements to commit for step.');
  }

  try {
    await db.batch(statements);
  } catch (err: any) {
    const errorMessage = err?.message ?? String(err);
    await db
      .prepare(
        `
          INSERT INTO ar_lesson_commits (
            draft_id, lesson_id, user_id, step, draft_version, error
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(draft_id, step, draft_version) DO UPDATE SET
            error = excluded.error,
            created_at = datetime('now')
        `
      )
      .bind(
        draftRow.draft_id,
        draftRow.lesson_id,
        userId,
        step,
        draftRow.draft_version,
        errorMessage
      )
      .run();
    throw new HttpError(500, 'Commit failed', { error: errorMessage });
  }

  let lessonId = draftRow.lesson_id;
  if (!lessonId) {
    const row = (await db
      .prepare(`SELECT lesson_id FROM ar_lesson_drafts WHERE draft_id = ?1`)
      .bind(draftRow.draft_id)
      .first()) as { lesson_id?: number } | null;
    lessonId = row?.lesson_id ?? null;
  }

  if (!lessonId) {
    throw new HttpError(500, 'Lesson id missing after commit.');
  }

  return { lessonId, counts, alreadyCommitted: false };
}

export async function handleCommitRequest(ctx: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}) {
  const bodyRaw = await (async () => {
    try {
      return await ctx.request.json();
    } catch {
      return null;
    }
  })();

  const body = asRecord(bodyRaw);
  if (!body) {
    return badRequest('Invalid JSON body');
  }

  const step = parseCommitStep(body.step);
  if (!step) {
    return badRequest('Invalid step');
  }

  const draftVersion = asInteger(body.draft_version ?? body.draftVersion);
  if (draftVersion == null) {
    return badRequest('draft_version is required');
  }

  return { step, draftVersion };
}

export function handleCommitError(err: unknown) {
  if (err instanceof HttpError) {
    return jsonResponse({ ok: false, error: err.message, details: err.details }, err.status);
  }
  return jsonResponse({ ok: false, error: (err as any)?.message ?? String(err) }, 500);
}

export function ensureDraftVersionMatch(draftRow: DraftRow, draftVersion: number) {
  if (draftRow.draft_version !== draftVersion) {
    return conflict('Draft version mismatch', draftRow.draft_version);
  }
  return null;
}

export { parseCommitStep };
