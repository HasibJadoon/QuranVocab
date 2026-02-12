#!/usr/bin/env node
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const dataRoot = path.join(repoRoot, "database", "data", "synonyms", "data-master");
const synonymsCsv = path.join(dataRoot, "synonyms", "synonyms.csv");
const synonymsDetailsJson = path.join(dataRoot, "synonyms", "synonymsdetails.json");
const summariesJson = path.join(dataRoot, "synonyms", "synonyms_summaries.json");

const BASE_URL = "https://qurandev.github.io/synonyms/content";

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

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

function htmlToText(html) {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withBreaks = stripped
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/div>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtml(noTags);
  return decoded.replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function extractArabic(text) {
  const match = text.match(/[\p{Script=Arabic}]+/u);
  return match ? match[0] : null;
}

function normalizeWordEn(text) {
  const cleaned = (text || "").trim();
  if (!cleaned) return null;
  return cleaned.replace(/[-\s]+$/g, "");
}

function normalizeWordAr(text) {
  const cleaned = (text || "").trim();
  if (!cleaned) return null;
  return cleaned.replace(/[-\s]+$/g, "");
}

function parseSynonyms(text) {
  const wordPattern = "[A-Za-z0-9]+(?:['’`][A-Za-z0-9]+)*-?";
  const wordWithQuote = `${wordPattern}['’"]?`;
  const pairs = new Map();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  const synLine = lines.find((line) => /synonyms\s*:/i.test(line));
  if (synLine) {
    const after = synLine.replace(/.*?synonyms\s*:/i, "");
    const regex = new RegExp(`(${wordWithQuote})\\s*([\\p{Script=Arabic}]+)`, "gu");
    let match;
    while ((match = regex.exec(after))) {
      const wordEn = normalizeWordEn(match[1]);
      const wordAr = normalizeWordAr(match[2]);
      if (wordEn && wordAr) pairs.set(wordEn, wordAr);
    }
  }

  const sectionRegex = new RegExp(`\\b\\d+(?:\\.\\d+)?\\s+(${wordWithQuote})\\s*\\(([^)]+)\\)`, "g");
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(text))) {
    const wordEn = normalizeWordEn(sectionMatch[1]);
    const wordAr = normalizeWordAr(extractArabic(sectionMatch[2]) || "");
    if (wordEn && wordAr) {
      if (!pairs.has(wordEn)) pairs.set(wordEn, wordAr);
    }
  }

  const genericRegex = new RegExp(`\\b(${wordWithQuote})\\s*\\(([^)]+)\\)`, "g");
  let genericMatch;
  while ((genericMatch = genericRegex.exec(text))) {
    const wordEn = normalizeWordEn(genericMatch[1]);
    const wordAr = normalizeWordAr(extractArabic(genericMatch[2]) || "");
    if (wordEn && wordAr) {
      if (!pairs.has(wordEn)) pairs.set(wordEn, wordAr);
    }
  }

  return Array.from(pairs.entries()).map(([wordEn, wordAr]) => ({ wordEn, wordAr }));
}

function parseSummary(text) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const summaryIndex = lines.findIndex((line) => /^summary\s*:?/i.test(line));
  if (summaryIndex === -1) return [];
  const out = [];
  for (let i = summaryIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[-]{5,}/.test(line)) break;
    if (!/^\d+(\.\d+)?/.test(line)) {
      if (/^summary\b/i.test(line)) continue;
      if (out.length === 0) continue;
      if (line === "") break;
      continue;
    }
    const match = line.match(/^(\d+(?:\.\d+)?)\s+([^:]+):\s*(.+)$/);
    if (!match) continue;
    const [, label, term, textVal] = match;
    out.push({ label, term: term.trim(), text: textVal.trim() });
  }
  return out;
}

function getMissingIds() {
  const csvText = stripBom(readText(synonymsCsv));
  const lines = csvText.trim().split(/\r?\n/);
  lines.shift();
  const ids = new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    const [id] = parseCsvLine(line);
    if (id) ids.add(id.trim());
  }

  const detailsText = stripBom(readText(synonymsDetailsJson));
  const details = JSON.parse(detailsText);
  const idsWithDetails = new Set();
  for (const item of details) {
    if (item && item.id) idsWithDetails.add(item.id);
  }

  const missing = [];
  for (const id of ids) {
    if (!idsWithDetails.has(id)) missing.push(id);
  }
  missing.sort();
  return missing;
}

async function fetchPage(id) {
  const prefixMatch = id.match(/^[A-Za-z]+/);
  if (!prefixMatch) return { id, ok: false, reason: "no-prefix" };
  const folder = prefixMatch[0].toLowerCase();
  const url = `${BASE_URL}/${folder}/${id.toLowerCase()}.html`;
  const res = await fetch(url);
  if (!res.ok) return { id, ok: false, reason: `http-${res.status}`, url };
  const html = await res.text();
  return { id, ok: true, url, html };
}

async function main() {
  const missingIds = getMissingIds();
  if (missingIds.length === 0) {
    console.log("No missing topic IDs.");
    return;
  }

  const detailsTextRaw = readText(synonymsDetailsJson);
  const hasBom = detailsTextRaw.startsWith("\uFEFF");
  const details = JSON.parse(stripBom(detailsTextRaw));
  const existingKeys = new Set(details.map((d) => `${d.id}||${d.word}||${d.wordEn}`));

  let summaries = {};
  if (fs.existsSync(summariesJson)) {
    const summariesText = stripBom(readText(summariesJson));
    summaries = JSON.parse(summariesText);
  }

  const skipped = [];
  const added = [];
  const summaryAdded = [];

  for (const id of missingIds) {
    const result = await fetchPage(id);
    if (!result.ok) {
      skipped.push({ id, reason: result.reason || "fetch-failed" });
      continue;
    }
    const text = htmlToText(result.html);
    if (/This Article hasn't been translated/i.test(text)) {
      skipped.push({ id, reason: "not-translated" });
      continue;
    }

    const pairs = parseSynonyms(text);
    if (pairs.length === 0) {
      skipped.push({ id, reason: "no-synonyms" });
      continue;
    }

    for (const pair of pairs) {
      const wordAr = normalizeWordAr(pair.wordAr);
      const wordEn = normalizeWordEn(pair.wordEn);
      if (!wordAr || !wordEn) continue;
      const key = `${id}||${wordAr}||${wordEn}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      details.push({ id, word: wordAr, wordEn, root: null });
      added.push({ id, word: wordAr, wordEn });
    }

    const summary = parseSummary(text);
    if (summary.length && !summaries[id]) {
      summaries[id] = summary;
      summaryAdded.push(id);
    }
  }

  const outDetails = (hasBom ? "\uFEFF" : "") + JSON.stringify(details, null, 2);
  fs.writeFileSync(synonymsDetailsJson, outDetails);

  fs.writeFileSync(summariesJson, JSON.stringify(summaries, null, 2));

  console.log(`Missing IDs: ${missingIds.length}`);
  console.log(`Added synonym entries: ${added.length}`);
  console.log(`Summary added for: ${summaryAdded.length}`);
  if (skipped.length) {
    console.log(`Skipped: ${skipped.length}`);
    const byReason = skipped.reduce((acc, cur) => {
      acc[cur.reason] = acc[cur.reason] || [];
      acc[cur.reason].push(cur.id);
      return acc;
    }, {});
    for (const [reason, ids] of Object.entries(byReason)) {
      console.log(`${reason}: ${ids.join(", ")}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
