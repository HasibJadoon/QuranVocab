import { type D1Database, type PagesFunction } from '@cloudflare/workers-types';

type GenerateLessonRequest = {
  passage: string;
  title?: string;
  status?: 'draft' | 'published' | 'done';
  lesson_type?: string;
  save?: boolean;
};

interface Env {
  DB: D1Database;
  CLAUDE_API_KEY?: string;
}

const sampleVocab = (passage: string) =>
  (passage.match(/[\p{Script=Arabic}]+/gu) ?? []).slice(0, 4).map((word, idx) => ({
    word,
    root: word.replace(/[^\p{Script=Arabic}]/gu, ''),
    meaning: `Meaning ${idx + 1}`,
    notes: 'auto-generated from Claude preview'
  }));

const buildLessonJson = (passage: string) => ({
  text: {
    arabic: passage,
    sentences: passage.split('۔').map((line) => line.trim()).filter(Boolean).join('\n'),
    translation: '',
    reference: 'Claude generated',
    mode: 'quran'
  },
  vocabulary: sampleVocab(passage),
  comprehension: [
    {
      type: 'memory_recall',
      verbs: ['تاب', 'علم'],
      nouns: ['كتاب', 'عالم'],
      questions: [
        { id: 1, question: 'What is the core theme of the passage?' },
        { id: 2, question: 'Identify a verb you can use in a sentence.' }
      ]
    },
    {
      type: 'passage_questions',
      questions: [
        { id: 1, question: 'How does the reference connect to earlier lessons?' }
      ]
    }
  ]
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body: GenerateLessonRequest = await request.json().catch(() => ({} as GenerateLessonRequest));
  const passage = (body.passage ?? '').trim();
  if (!passage) {
    return Response.json({ ok: false, error: 'passage is required' }, { status: 400 });
  }

  const lessonJson = buildLessonJson(passage);
  const payload = {
    title: body.title?.trim() || 'Claude-generated lesson',
    lesson_type: body.lesson_type || 'Quran',
    subtype: 'generated',
    source: 'Claude preview',
    status: body.status || 'draft',
    lesson_json: JSON.stringify(lessonJson)
  };

  let saved = null;
  if (body.save && env.DB) {
    const res = await env.DB.prepare(
      `INSERT INTO ar_lessons (title, lesson_type, subtype, source, status, lesson_json)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, created_at`
    )
      .bind(payload.title, payload.lesson_type, payload.subtype, payload.source, payload.status, payload.lesson_json)
      .run();
    saved = res?.results?.[0] ?? null;
  }

  return Response.json({
    ok: true,
    lesson_json: lessonJson,
    generated_at: new Date().toISOString(),
    saved
  });
};
