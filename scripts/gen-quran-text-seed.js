const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const dataDir = path.join(__dirname, '..', 'database', 'data', 'tarteel.ai');
const simpleSql = path.join(dataDir, 'quran-simple-clean.sql');
const insertsSql = path.join(dataDir, 'quran_text_inserts.sql');
const versesDb = path.join(dataDir, 'quran-metadata-ayah.sqlite');
const chaptersDb = path.join(dataDir, 'quran-metadata-surah-name.sqlite');
const surahInfoDb = path.join(dataDir, 'surah-info-en.db');
const outFile = path.join(__dirname, '..', 'database', 'migrations', 'seed-ar_quran_text.sql');

const tmpDir = path.join(os.tmpdir(), 'kmap-quran');
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
const insertsDb = path.join(tmpDir, 'quran_inserts.db');
const runSqlite = (dbPath, commands) => {
  execSync(`sqlite3 "${dbPath}"`, {
    input: commands,
    stdio: ['pipe', 'inherit', 'inherit'],
    maxBuffer: 1024 * 1024 * 32,
  });
};

const querySqlite = (dbPath, sql) => {
  const result = execSync(`sqlite3 "${dbPath}"`, {
    input: `.mode json
${sql}
`,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
  });
  return JSON.parse(result);
};

runSqlite(insertsDb, `DROP TABLE IF EXISTS quran_text;
CREATE TABLE quran_text (
  sura INTEGER,
  aya INTEGER,
  surah_ayah INTEGER,
  page INTEGER,
  juz INTEGER,
  hizb INTEGER,
  ruku INTEGER,
  surah_name TEXT,
  surah_verse TEXT,
  verse_mark TEXT,
  text TEXT,
  text_simple TEXT,
  text_normalized TEXT,
  first_word TEXT,
  last_word TEXT,
  word_count INTEGER,
  char_count INTEGER
);
.read "${insertsSql}"
`);

const insertsRows = querySqlite(insertsDb, 'SELECT * FROM quran_text;');
const simpleContent = fs.readFileSync(simpleSql, 'utf8');
const versesRows = querySqlite(versesDb, 'SELECT surah_number, ayah_number, text FROM verses;');
const chaptersRows = querySqlite(chaptersDb, 'SELECT * FROM chapters;');
const surahInfos = querySqlite(surahInfoDb, 'SELECT * FROM surah_infos;');

const simpleMap = new Map();
const tupleRegex = /\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:''|[^'])*)'\s*\)/g;
let tupleMatch;
while ((tupleMatch = tupleRegex.exec(simpleContent)) !== null) {
  const sura = tupleMatch[1];
  const aya = tupleMatch[2];
  const text = tupleMatch[3].replace(/''/g, "'");
  simpleMap.set(`${sura}:${aya}`, text.trim());
}
const versesMap = new Map(
  versesRows.map((row) => [`${row.surah_number}:${row.ayah_number}`, row.text?.trim() ?? ''])
);
const chapterMap = new Map(chaptersRows.map((row) => [row.id, row]));
const surahInfoMap = new Map(surahInfos.map((row) => [row.surah_number, row]));

const escape = (value) =>
  value === null || value === undefined
    ? 'NULL'
    : `'${String(value).replace(/'/g, "''")}'`;

const normalize = (text) =>
  (text ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const enriched = insertsRows.map((row) => {
  const key = `${row.sura}:${row.aya}`;
  const cleanText = simpleMap.get(key) || '';
  const verseFull = versesMap.get(key) || '';
  const chapter = chapterMap.get(row.sura);
  const surahInfo = surahInfoMap.get(row.sura);
  return {
    ...row,
    surah_name_en: chapter?.name || surahInfo?.surah_name || null,
    surah_short_text: surahInfo?.short_text || null,
    text_simple: cleanText || row.text_simple || row.text,
    text_normalized:
      normalize(cleanText) || normalize(row.text_normalized) || normalize(row.text_simple) || normalize(row.text),
    text_diacritics: row.text,
    text_non_diacritics: cleanText || row.text_simple || row.text,
    verse_full: verseFull || row.verse_mark,
  };
});

const columns = [
  'sura',
  'aya',
  'surah_ayah',
  'page',
  'juz',
  'hizb',
  'ruku',
  'surah_name',
  'surah_name_en',
  'surah_short_text',
  'surah_verse',
  'verse_mark',
  'verse_full',
  'text',
  'text_simple',
  'text_normalized',
  'text_diacritics',
  'text_non_diacritics',
  'first_word',
  'last_word',
  'word_count',
  'char_count',
];

const statements = enriched
  .map((row) => {
    const vals = columns.map((col) => escape(row[col] ?? null));
    return `INSERT INTO ar_quran_text (${columns.join(', ')}) VALUES (${vals.join(', ')});`;
  })
  .join('\n');

const sql = `BEGIN TRANSACTION;\nDELETE FROM ar_quran_text;\n${statements}\nCOMMIT;\n`;
fs.writeFileSync(outFile, sql);
console.log(`Wrote ${enriched.length} records to ${outFile}`);
