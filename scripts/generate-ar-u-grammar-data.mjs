import fs from 'fs';
import path from 'path';

const src = path.resolve('notes/resources/ar_u_grammar_seed.csv');
const out = path.resolve('apps/k-maps/src/app/shared/data/ar-u-grammar.data.ts');

const text = fs.readFileSync(src, 'utf8');

function parseCSV(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        const next = input[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const allRows = parseCSV(text)
  .map((row) => row.map((cell) => (cell ?? '').trim()))
  .filter((row) => row.some((cell) => cell !== ''));

if (!allRows.length) {
  throw new Error('No rows found in CSV.');
}

const header = allRows[0];
const dataRows = allRows.slice(1);

function normalize(value, allowEmpty = false) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed && !allowEmpty) return null;
  return trimmed;
}

const rows = dataRows.map((row) => {
  const record = {};
  for (let i = 0; i < header.length; i += 1) {
    record[header[i]] = row[i] ?? '';
  }
  const metaRaw = normalize(record.meta_json || '', false);
  let meta = null;
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      meta = metaRaw;
    }
  }

  return {
    ar_u_grammar: normalize(record.ar_u_grammar || ''),
    canonical_input: normalize(record.canonical_input || '', true) || '',
    grammar_id: normalize(record.grammar_id || '', true) || '',
    category: normalize(record.category || ''),
    title: normalize(record.title || ''),
    title_ar: normalize(record.title_ar || ''),
    definition: normalize(record.definition || ''),
    definition_ar: normalize(record.definition_ar || ''),
    meta_json: meta,
  };
});

for (const row of rows) {
  if (!row.title_ar) {
    row.title_ar = row.title || row.grammar_id || '';
  }
}

rows.sort((a, b) => {
  if (a.grammar_id === b.grammar_id) {
    return a.canonical_input.localeCompare(b.canonical_input);
  }
  return a.grammar_id.localeCompare(b.grammar_id);
});

function tsValue(value) {
  if (value === null) return 'null';
  return JSON.stringify(value, null, 0);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
let outText = '';
outText += '// Generated from notes/resources/ar_u_grammar_seed.csv.\n';
outText += '// Do not edit manually; regenerate from the CSV source.\n\n';

outText += 'export interface ArUGrammarConcept {\n';
outText += '  ar_u_grammar: string | null;\n';
outText += '  canonical_input: string;\n';
outText += '  grammar_id: string;\n';
outText += '  category: string | null;\n';
outText += '  title: string | null;\n';
outText += '  title_ar: string | null;\n';
outText += '  definition: string | null;\n';
outText += '  definition_ar: string | null;\n';
outText += '  meta_json: Record<string, unknown> | string | null;\n';
outText += '}\n\n';

outText += 'const ARABIC_DIACRITICS_RE = /[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]/g;\n';
outText += 'const ARABIC_TATWEEL_RE = /\\u0640/g;\n\n';
outText += 'export const normalizeArabicKey = (value: string) =>\n';
outText += '  value\n';
outText += '    .normalize(\'NFKC\')\n';
outText += '    .replace(ARABIC_DIACRITICS_RE, \'\')\n';
outText += '    .replace(ARABIC_TATWEEL_RE, \'\')\n';
outText += '    .trim();\n\n';

outText += 'export const AR_U_GRAMMAR_LIST: ArUGrammarConcept[] = [\n';
for (const row of rows) {
  outText += '  {\n';
  outText += `    ar_u_grammar: ${tsValue(row.ar_u_grammar)},\n`;
  outText += `    canonical_input: ${tsValue(row.canonical_input)},\n`;
  outText += `    grammar_id: ${tsValue(row.grammar_id)},\n`;
  outText += `    category: ${tsValue(row.category)},\n`;
  outText += `    title: ${tsValue(row.title)},\n`;
  outText += `    title_ar: ${tsValue(row.title_ar)},\n`;
  outText += `    definition: ${tsValue(row.definition)},\n`;
  outText += `    definition_ar: ${tsValue(row.definition_ar)},\n`;
  outText += `    meta_json: ${tsValue(row.meta_json)},\n`;
  outText += '  },\n';
}
outText += '];\n\n';

outText += 'export const AR_U_GRAMMAR_BY_ID: Record<string, ArUGrammarConcept> = Object.fromEntries(\n';
outText += '  AR_U_GRAMMAR_LIST.map((concept) => [concept.grammar_id, concept])\n';
outText += ');\n\n';

outText += 'export const AR_U_GRAMMAR_BY_CANONICAL_INPUT: Record<string, ArUGrammarConcept> = Object.fromEntries(\n';
outText += '  AR_U_GRAMMAR_LIST.map((concept) => [concept.canonical_input, concept])\n';
outText += ');\n\n';

outText += 'export const AR_U_GRAMMAR_BY_TITLE_AR: Record<string, ArUGrammarConcept[]> = AR_U_GRAMMAR_LIST.reduce(\n';
outText += '  (acc, concept) => {\n';
outText += '    const key = concept.title_ar?.trim();\n';
outText += '    if (!key) return acc;\n';
outText += '    (acc[key] ??= []).push(concept);\n';
outText += '    return acc;\n';
outText += '  },\n';
outText += '  {} as Record<string, ArUGrammarConcept[]>\n';
outText += ');\n\n';

outText += 'export const AR_U_GRAMMAR_BY_TITLE_AR_NORMALIZED: Record<string, ArUGrammarConcept[]> = AR_U_GRAMMAR_LIST.reduce(\n';
outText += '  (acc, concept) => {\n';
outText += '    const key = concept.title_ar ? normalizeArabicKey(concept.title_ar) : \'\';\n';
outText += '    if (!key) return acc;\n';
outText += '    (acc[key] ??= []).push(concept);\n';
outText += '    return acc;\n';
outText += '  },\n';
outText += '  {} as Record<string, ArUGrammarConcept[]>\n';
outText += ');\n';

fs.writeFileSync(out, outText, 'utf8');
console.log(`Wrote ${out} with ${rows.length} concepts.`);
