#!/usr/bin/env node
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const dataRoot = path.join(repoRoot, "database", "data", "synonyms", "data-master");
const synonymsCsv = path.join(dataRoot, "synonyms", "synonyms.csv");
const synonymsDetailsJson = path.join(dataRoot, "synonyms", "synonymsdetails.json");
const synonymsSummariesJson = path.join(dataRoot, "synonyms", "synonyms_summaries.json");
const topicsAyahsMapJson = path.join(dataRoot, "topics", "topicsAyahsMap.json");
const outputCsv = path.join(dataRoot, "synonyms", "synonyms_map.csv");
const outputJson = path.join(dataRoot, "synonyms", "synonyms_map.json");
const outputWordsJson = path.join(dataRoot, "synonyms", "synonyms_words_ar.json");

const ROOT_AR_MAP = {
  A: "ا",
  b: "ب",
  t: "ت",
  v: "ث",
  j: "ج",
  H: "ح",
  x: "خ",
  d: "د",
  "*": "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  $: "ش",
  S: "ص",
  D: "ض",
  T: "ط",
  Z: "ظ",
  E: "ع",
  g: "غ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  y: "ي",
};

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function escapeCsv(val) {
  const str = val == null ? "" : String(val);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toArabicRoot(root) {
  const trimmed = (root || "").trim();
  if (!trimmed) return null;
  let out = "";
  for (const ch of trimmed) {
    const mapped = ROOT_AR_MAP[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out || null;
}

const AR_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

function splitArabicVariants(word) {
  const base = (word || "").split("(")[0].trim();
  if (!base) return [];
  return base
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeArabicWord(word) {
  let out = (word || "").trim();
  if (!out) return null;
  out = out.replace(AR_DIACRITICS, "").replace(TATWEEL, "");
  out = out.replace(/[^\p{Script=Arabic}]/gu, "");
  return out || null;
}

function loadSynonyms() {
  const text = stripBom(readText(synonymsCsv));
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) return [];
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const [id, topic, topicUr] = parseCsvLine(line);
    rows.push({ id: (id || "").trim(), topic: (topic || "").trim(), topicUr: (topicUr || "").trim() });
  }
  return rows;
}

function loadSynonymsDetails() {
  const text = stripBom(readText(synonymsDetailsJson));
  const data = JSON.parse(text);
  const byId = new Map();
  for (const item of data) {
    if (!item || !item.id) continue;
    const arr = byId.get(item.id) || [];
    arr.push({
      word: item.word || "",
      wordEn: item.wordEn || "",
      root: item.root || "",
    });
    byId.set(item.id, arr);
  }
  return byId;
}

function loadTopicsAyahsMap() {
  const text = stripBom(readText(topicsAyahsMapJson));
  const data = JSON.parse(text);
  const byId = new Map();
  for (const item of data) {
    if (!item || !item.t) continue;
    const refsRaw = (item.r || "").trim();
    const refs = refsRaw ? refsRaw.split(/\s+/) : [];
    const seen = new Set();
    const uniq = [];
    for (const ref of refs) {
      if (!ref) continue;
      if (seen.has(ref)) continue;
      seen.add(ref);
      uniq.push(ref);
    }
    byId.set(item.t, uniq);
  }
  return byId;
}

function loadSummaries() {
  if (!fs.existsSync(synonymsSummariesJson)) return new Map();
  const text = stripBom(readText(synonymsSummariesJson));
  const data = JSON.parse(text);
  const byId = new Map();
  for (const [id, summary] of Object.entries(data || {})) {
    if (!id || !Array.isArray(summary)) continue;
    byId.set(id, summary);
  }
  return byId;
}

const synonyms = loadSynonyms();
const detailsById = loadSynonymsDetails();
const refsById = loadTopicsAyahsMap();
const summariesById = loadSummaries();

const synonymsById = new Map();
for (const s of synonyms) synonymsById.set(s.id, s);

const allIds = new Set([
  ...synonymsById.keys(),
]);

const header = [
  "id",
  "topic",
  "topic_ur",
  "word_ar",
  "word_en",
  "root",
  "root_ar",
  "ref_surah",
  "ref_ayah",
  "ref",
];

const rows = [header.map(escapeCsv).join(",")];
const topicsJson = [];
const wordsJson = [];

function emitRowsForId(id, topic, topicUr) {
  const details = detailsById.get(id) || [{ word: "", wordEn: "", root: "" }];
  const refs = refsById.get(id) || [];

  if (refs.length === 0) {
    for (const d of details) {
      const rootAr = toArabicRoot(d.root);
      rows.push([
        id,
        topic,
        topicUr,
        d.word,
        d.wordEn,
        d.root,
        rootAr,
        "",
        "",
        "",
      ].map(escapeCsv).join(","));
    }
    return;
  }

  for (const d of details) {
    for (const ref of refs) {
      const rootAr = toArabicRoot(d.root);
      const [surah, ayah] = ref.split(":");
      rows.push([
        id,
        topic,
        topicUr,
        d.word,
        d.wordEn,
        d.root,
        rootAr,
        surah || "",
        ayah || "",
        ref,
      ].map(escapeCsv).join(","));
    }
  }
}

for (const id of allIds) {
  const s = synonymsById.get(id) || { id, topic: "", topicUr: "" };
  const detailsRaw = detailsById.get(id) || [];
  const seenSyn = new Set();
  const synonymsArr = [];
  const rootsSet = new Set();
  const rootsArSet = new Set();
  const wordsArSet = new Set();
  for (const d of detailsRaw) {
    const wordAr = d.word || "";
    const wordEn = d.wordEn || "";
    const root = d.root || "";
    const rootAr = toArabicRoot(root);
    const key = `${wordAr}||${wordEn}||${root}`;
    if (seenSyn.has(key)) continue;
    seenSyn.add(key);
    synonymsArr.push({
      word_ar: wordAr,
      word_en: wordEn,
      root: root || null,
      root_ar: rootAr,
    });
    if (root) rootsSet.add(root);
    if (rootAr) rootsArSet.add(rootAr);
  }
  for (const d of detailsRaw) {
    for (const part of splitArabicVariants(d.word || "")) {
      const normalized = normalizeArabicWord(part);
      if (normalized) wordsArSet.add(normalized);
    }
  }
  const refs = refsById.get(id) || [];
  const wordsAr = Array.from(wordsArSet);
  const searchKeysNorm = wordsAr.length ? wordsAr.join(" ") : null;
  const summary = summariesById.get(id) || null;
  topicsJson.push({
    id: s.id,
    word: s.topic,
    topic: s.topic,
    topic_ur: s.topicUr,
    synonyms: synonymsArr,
    roots: Array.from(rootsSet),
    roots_ar: Array.from(rootsArSet),
    search_keys_norm: searchKeysNorm,
    summary: summary,
    verses: refs,
    topic_verse_map: {
      id: s.id,
      topic: s.topic,
      verses: refs,
    },
  });
  wordsJson.push({
    id: s.id,
    topic: s.topic,
    topic_ur: s.topicUr,
    words_ar: wordsAr,
    search_keys_norm: searchKeysNorm,
  });
  emitRowsForId(s.id, s.topic, s.topicUr);
}

fs.writeFileSync(outputCsv, rows.join("\n"));
fs.writeFileSync(outputJson, JSON.stringify({ topics: topicsJson }, null, 2));
fs.writeFileSync(outputWordsJson, JSON.stringify({ topics: wordsJson }, null, 2));

const totalRows = rows.length - 1;
console.log(`Wrote ${outputCsv}`);
console.log(`Wrote ${outputJson}`);
console.log(`Wrote ${outputWordsJson}`);
console.log(`Total rows: ${totalRows}`);
