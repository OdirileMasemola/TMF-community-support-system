/** Trims a text value; blank, null and missing values become null (stored as SQL NULL). */
export function trimmedOrNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
