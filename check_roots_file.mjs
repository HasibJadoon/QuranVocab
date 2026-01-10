#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- CONFIG ----
const ENDPOINT_BASE = "https://4624e215.arabic-vocabulary.pages.dev"; // change if you want main/preview
const CHECK_PATH = "/check-roots"; // your Pages Function route
// ----------------

// Normalize Arabic roots (trim + remove tashkeel)
function normalizeRoot(s) {
  return String(s || "")
    .replace(/[\u064B-\u065F]/g, "") // tashkeel
    .trim();
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Helpful error if something is wrong
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}\n${text}`);
  }

  return res.json();
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node check_roots_file.mjs <path-to-json-file>");
    process.exit(1);
  }

  const absInputPath = path.resolve(process.cwd(), inputPath);
  const inputDir = path.dirname(absInputPath);

  // Read file
  const raw = fs.readFileSync(absInputPath, "utf8");
  const data = JSON.parse(raw);

  if (!data || !Array.isArray(data.Words)) {
    throw new Error(`Invalid JSON: expected { "Words": [...] } in ${absInputPath}`);
  }

  // Normalize roots + keep mapping to original words
  const words = data.Words.map((w) => ({
    ...w,
    root: normalizeRoot(w.root),
  })).filter(w => w.root.length > 0);

  // Unique roots for DB check
  const rootsUnique = Array.from(new Set(words.map((w) => w.root)));

  // Call remote function
  const url = new URL(CHECK_PATH, ENDPOINT_BASE).toString();
  const result = await postJson(url, { roots: rootsUnique });

  // result: { existing: [...], new: [...] } (your API response)
  const existingSet = new Set((result.existing || []).map(normalizeRoot));

  const existingWords = [];
  const newWords = [];

  for (const w of words) {
    if (existingSet.has(w.root)) existingWords.push(w);
    else newWords.push(w);
  }

  // Output JSON
  const output = {
    source_file: path.basename(absInputPath),
    endpoint: url,
    totals: {
      words: words.length,
      unique_roots_sent: rootsUnique.length,
      existing_words: existingWords.length,
      new_words: newWords.length,
    },
    existing: existingWords,
    new: newWords,
  };

  const outName =
    path.basename(absInputPath, path.extname(absInputPath)) + ".checked.json";
  const outPath = path.join(inputDir, outName);

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`✅ Done`);
  console.log(`Input:  ${absInputPath}`);
  console.log(`Output: ${outPath}`);
  console.log(`Existing words: ${existingWords.length}`);
  console.log(`New words:      ${newWords.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err?.message || err);
  process.exit(1);
});
