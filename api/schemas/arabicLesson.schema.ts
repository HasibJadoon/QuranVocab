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
    title_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
    status: { type: "string" },
    difficulty: { type: "integer" },

    reference: {
      type: "object",
      additionalProperties: false,
      required: [
        "source_type",
        "source_ref_id",
        "surah",
        "ayah_from",
        "ayah_to",
        "ref_label",
        "citation",
      ],
      properties: {
        source_type: { type: "string" },
        source_ref_id: { anyOf: [{ type: "string" }, { type: "null" }] },
        surah: { anyOf: [{ type: "integer" }, { type: "null" }] },
        ayah_from: { anyOf: [{ type: "integer" }, { type: "null" }] },
        ayah_to: { anyOf: [{ type: "integer" }, { type: "null" }] },
        ref_label: { anyOf: [{ type: "string" }, { type: "null" }] },
        citation: { anyOf: [{ type: "string" }, { type: "null" }] },
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
            required: [
              "unit_id",
              "unit_type",
              "arabic",
              "translation",
              "surah",
              "ayah",
              "notes",
            ],
            properties: {
              unit_id: { type: "string" },
              unit_type: { const: "ayah" },
              arabic: { type: "string" },
              translation: { anyOf: [{ type: "string" }, { type: "null" }] },
              surah: { type: "integer" },
              ayah: { type: "integer" },
              notes: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        },
      },
    },

    sentences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sentence_id",
          "unit_id",
          "arabic",
          "translation",
          "notes",
          "tokens",
        ],
        properties: {
          sentence_id: { type: "string" },
          unit_id: { type: "string" },
          arabic: { type: "string" },
          translation: { anyOf: [{ type: "string" }, { type: "null" }] },
          notes: { anyOf: [{ type: "string" }, { type: "null" }] },
          grammar_concept_refs: {
            anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
          },
          tokens: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "token_id",
                "surface_ar",
                "lemma_ar",
                "root",
                "root_id",
                "pos",
              ],
              properties: {
                token_id: { type: "string" },
                surface_ar: { type: "string" }, // must include "و" as its own token when applicable
                lemma_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
                root: { anyOf: [{ type: "string" }, { type: "null" }] },
                root_id: { anyOf: [{ type: "integer" }, { type: "null" }] },
                pos: { type: "string" },
                features: { anyOf: [{ type: "object", additionalProperties: false }, { type: "null" }] },
                morph_ref: {
                  anyOf: [
                    {
                      type: "object",
                      additionalProperties: false,
                      required: ["root_id", "lexicon_entry_id"],
                      properties: {
                        root_id: { anyOf: [{ type: "integer" }, { type: "null" }] },
                        lexicon_entry_id: { anyOf: [{ type: "integer" }, { type: "null" }] },
                      },
                    },
                    { type: "null" },
                  ],
                },
              },
            },
          },
        },
      },
    },

    passage_layers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "layer_id",
          "layer_type",
          "label",
          "label_ar",
          "linked_unit_ids",
          "linked_sentence_ids",
          "linked_token_ids",
          "notes",
        ],
        properties: {
          layer_id: { type: "string" },
          layer_type: { type: "string" },
          label: { type: "string" },
          label_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
          linked_unit_ids: { type: "array", items: { type: "string" } },
          linked_sentence_ids: { type: "array", items: { type: "string" } },
          linked_token_ids: { type: "array", items: { type: "string" } },
          notes: { anyOf: [{ type: "string" }, { type: "null" }] },
              data: { anyOf: [{ type: "object", additionalProperties: false }, { type: "null" }] },
        },
      },
    },

    comprehension: {
      type: "object",
      additionalProperties: false,
      required: ["reflective", "analytical", "mcqs"],
      properties: {
        reflective: {
          type: "array",
            items: {
              type: "object",
              additionalProperties: false,
               required: [
                 "question_id",
                 "linked_unit_ids",
                 "question",
               ],
            properties: {
              question_id: { type: "string" },
              linked_unit_ids: { type: "array", items: { type: "string" } },
              question: { type: "string" },
              question_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
              answer_hint: { anyOf: [{ type: "string" }, { type: "null" }] },
              tags: { type: "array", items: { type: "string" } },
              quranic_ref: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        },
        analytical: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "question_id",
              "linked_unit_ids",
              "question",
            ],
            properties: {
              question_id: { type: "string" },
              linked_unit_ids: { type: "array", items: { type: "string" } },
              question: { type: "string" },
              question_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
              answer_hint: { anyOf: [{ type: "string" }, { type: "null" }] },
              tags: { type: "array", items: { type: "string" } },
              quranic_ref: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        },
        mcqs: {
          type: "object",
          additionalProperties: false,
          required: ["text", "vocabulary", "grammar"],
          properties: {
            text: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "mcq_id",
                  "linked_unit_ids",
                  "question",
                  "options",
                ],
                properties: {
                  mcq_id: { type: "string" },
                  linked_unit_ids: { type: "array", items: { type: "string" } },
                  question: { type: "string" },
                  question_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["option", "is_correct"],
                      properties: {
                        option: { type: "string" },
                        is_correct: { type: "boolean" },
                        explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                      },
                    },
                  },
                  explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                  tags: { type: "array", items: { type: "string" } },
                },
              },
            },
            vocabulary: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "mcq_id",
                  "linked_unit_ids",
                  "question",
                  "options",
                ],
                properties: {
                  mcq_id: { type: "string" },
                  linked_unit_ids: { type: "array", items: { type: "string" } },
                  question: { type: "string" },
                  question_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["option", "is_correct"],
                      properties: {
                        option: { type: "string" },
                        is_correct: { type: "boolean" },
                        explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                      },
                    },
                  },
                  explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                  tags: { type: "array", items: { type: "string" } },
                },
              },
            },
            grammar: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "mcq_id",
                  "linked_unit_ids",
                  "question",
                  "options",
                ],
                properties: {
                  mcq_id: { type: "string" },
                  linked_unit_ids: { type: "array", items: { type: "string" } },
                  question: { type: "string" },
                  question_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["option", "is_correct"],
                      properties: {
                        option: { type: "string" },
                        is_correct: { type: "boolean" },
                        explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                      },
                    },
                  },
                  explanation: { anyOf: [{ type: "string" }, { type: "null" }] },
                  tags: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },

    created_at: { type: "string" },
    updated_at: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
} as const;
