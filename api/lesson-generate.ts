import { generateLessonWithClaude } from "./claudeGenerateLesson";
import type { PagesFunction } from "@cloudflare/workers-types";

interface Env {
  ANTHROPIC_API_KEY?: string;
  CLAUDE_API_KEY?: string;
}

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, any> | null = null;
  try {
    body = (await request.json()) as Record<string, any>;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const passage = typeof body?.passage === "string" ? body.passage.trim() : "";
  const textBlock = typeof body?.text === "string" ? body.text : undefined;
  const lessonInput =
    body?.lesson ?? (textBlock ? { text: { arabic: textBlock } } : null) ??
    (passage ? { text: { arabic: passage } } : null);

  if (!lessonInput) {
    return new Response(
      JSON.stringify({ ok: false, error: "lesson or text/passage input is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  try {
    const generatedLesson = await generateLessonWithClaude(
      {
        lesson: lessonInput,
        options: typeof body?.options === "object" ? body.options : undefined,
      },
      env
    );

    return new Response(
      JSON.stringify({
        ok: true,
        generated_lesson: generatedLesson,
        generated_at: new Date().toISOString(),
        input: lessonInput,
      }),
      { headers: jsonHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? "Failed to generate lesson" }),
      { status: 500, headers: jsonHeaders }
    );
  }
};
