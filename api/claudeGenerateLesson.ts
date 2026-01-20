import { ArabicLessonSchema } from "./schemas/arabicLesson.schema";

type GenerateLessonRequest = {
  lesson: any;
  options?: {
    model?: string;
    max_tokens?: number;
  };
};

type ClaudeEnv = {
  ANTHROPIC_API_KEY?: string;
  CLAUDE_API_KEY?: string;
};

export async function generateLessonWithClaude(
  payload: GenerateLessonRequest,
  env: ClaudeEnv
) {
  const key = env.ANTHROPIC_API_KEY ?? env.CLAUDE_API_KEY;
  if (!key) {
    throw new Error("Claude API key is missing");
  }

  const model = payload.options?.model ?? "claude-sonnet-4-5";
  const max_tokens = payload.options?.max_tokens ?? 4096;

  const systemInstructions = `
You are generating a structured Arabic lesson JSON object.
HARD RULES:
- Do NOT alter the Arabic ayah strings. Keep EXACT, including markers like ﴿١﴾.
- Tokenize by splitting attached harf when present: و / ف / ب / ك / ل / س must be their own tokens if attached (e.g., "وكذلك" => ["و","كذلك"]).
- sentences reference unit_id from text.arabic_full.
- grammar_concept_refs: only reference concept IDs (strings). Do not define concepts here.
- passage_layers must capture discourse / rhetoric / reasoning / idiom layers.
- comprehension must include reflective + analytical + MCQs in 3 groups: text/vocabulary/grammar.
Return ONLY valid JSON that matches the schema.
`.trim();

  if (!payload.lesson) {
    throw new Error("Lesson payload is required");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "structured-outputs-2025-11-13",
    },
    body: JSON.stringify({
      model,
      max_tokens,
      system: systemInstructions,
      messages: [{ role: "user", content: JSON.stringify(payload.lesson) }],
      output_format: {
        type: "json_schema",
        schema: ArabicLessonSchema,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude error ${res.status}: ${errText}`);
  }

  const data = await res.json().catch(() => null);

  const outputText = data?.content?.[0]?.text;
  if (!outputText) {
    throw new Error("No structured JSON returned in content[0].text");
  }

  return JSON.parse(outputText);
}
