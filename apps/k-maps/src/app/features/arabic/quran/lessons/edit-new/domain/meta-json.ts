export function parseJsonObject(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return { raw };
  }
}

export function buildUnitMeta(unitMetaJson: string, label?: string | null): Record<string, unknown> | null {
  const hasJson = unitMetaJson.trim().length > 0;
  const meta = hasJson ? parseJsonObject(unitMetaJson) : {};
  const trimmedLabel = label?.trim();
  if (trimmedLabel) {
    meta['label'] = trimmedLabel;
  }
  if (!hasJson && !trimmedLabel) return null;
  return meta;
}
