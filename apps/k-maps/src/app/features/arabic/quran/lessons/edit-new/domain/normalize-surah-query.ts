export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

export function normalizeSurahQuery(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return normalizeDigits(trimmed);
}
