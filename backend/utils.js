// ============================================================
// utils.js — small shared helpers for the API.
// ============================================================

// labd replies in prose even when asked for JSON, so pull the first
// JSON object out of whatever it wrapped it in — most often a
// ```json fence, sometimes a sentence of preamble.
export function extractJson(text) {
  if (typeof text !== 'string') return null;

  const cleaned = text.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Clamp anything into a 0-100 integer, or return null if it is not a number.
export function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Trim a list of names: drop non-strings, blanks and duplicates.
export function cleanNames(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const name = item.trim();
    if (name) seen.add(name);
  }
  return [...seen];
}

// Keep the prompt (and so the bill) bounded on long resumes.
export function truncate(text, max) {
  const s = typeof text === 'string' ? text : '';
  return s.length <= max ? s : s.slice(0, max);
}
