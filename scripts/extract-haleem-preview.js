const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'notes', 'resources', 'TheQuran-ANewTranslation.pdf');
const outputPath = path.join(__dirname, '..', 'notes', 'resources', 'TheQuran-ANewTranslation.preview.txt');

const yTolerance = 2.0;
const maxPages = 12;

function groupLines(items) {
  const lines = [];
  const sorted = items
    .map((item) => ({
      text: String(item.str ?? '').trim(),
      x: item.transform[4],
      y: item.transform[5],
    }))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => (b.y - a.y) || (a.x - b.x));

  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= yTolerance);
    if (line) {
      line.items.push(item);
      line.y = (line.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .map((line) =>
      line.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

(async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const total = Math.min(doc.numPages, maxPages);
  const out = [];

  for (let pageNum = 1; pageNum <= total; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = groupLines(content.items);
    out.push(`\n=== Page ${pageNum} ===\n`);
    out.push(lines.join('\n'));
  }

  fs.writeFileSync(outputPath, out.join('\n'));
  console.log(`Wrote preview to ${outputPath}`);
})();
