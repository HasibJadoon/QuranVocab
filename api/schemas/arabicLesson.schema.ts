export const ArabicLessonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "entity_type",
    "id",
    "lesson_type",
    "reference",
    "text",
    "sentences",
    "passage_layers",
    "comprehension",
  ],
    properties: {
      entity_type: { const: "ar_lesson" },
      id: { type: "string" },
      lesson_type: { type: "string" },
      subtype: { anyOf: [{ type: "string" }, { type: "null" }] },
      title: { type: "string" },
      status: { type: "string" },
      difficulty: { type: "integer" },
      reference: {
        type: "object",
        additionalProperties: false,
        required: [
          "source_type",
        "surah",
        "ayah_from",
        "ayah_to",
        "citation",
      ],
        properties: {
          source_type: { type: "string" },
          source_ref_id: { anyOf: [{ type: "string" }, { type: "null" }] },
        surah: { anyOf: [{ type: "integer" }, { type: "null" }] },
        ayah_from: { anyOf: [{ type: "integer" }, { type: "null" }] },
        ayah_to: { anyOf: [{ type: "integer" }, { type: "null" }] },
          ref_label: { anyOf: [{ type: "string" }, { type: "null" }] },
          citation: { type: "string" },
        },
    },
    text: {
      type: "object",
      additionalProperties: false,
      required: ["arabic_full", "mode"],
      properties: {
        mode: { type: "string" },
        arabic_full: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["unit_id", "arabic", "surah", "ayah"],
            properties: {
              unit_id: { type: "string" },
              arabic: { type: "string" },
              surah: { type: "integer" },
              ayah: { type: "integer" },
              translation: { anyOf: [{ type: "string" }, { type: "null" }] },
              notes: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        },
      },
    },
    sentences: {
      type: "array",
    },
    passage_layers: {
      type: "array",
    },
    comprehension: {
      type: "object",
      additionalProperties: false,
      required: ["reflective", "analytical", "mcqs"],
      properties: {
        reflective: { type: "array" },
        analytical: { type: "array" },
        mcqs: {
          type: "object",
          additionalProperties: false,
          required: ["text", "vocabulary", "grammar"],
          properties: {
            text: { type: "array" },
            vocabulary: { type: "array" },
            grammar: { type: "array" },
          },
        },
      },
    },
    created_at: { type: "string" },
    updated_at: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
} as const;
