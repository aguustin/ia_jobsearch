const COMPANY_NOISE =
  /\b(inc|llc|ltd|corp|corporation|srl|s\.a\.|s\.r\.l\.|solutions|technologies|technology|tech|software|group|company|co|gmbh|ag|bv|spa|sas)\b/gi;

const TITLE_STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "in", "at", "to", "of",
  "is", "be", "with", "as", "on", "we", "are", "our", "you",
]);

function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(COMPANY_NOISE, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text = "") {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !TITLE_STOPWORDS.has(w));
}

function jaccard(tokens1, tokens2) {
  const s1 = new Set(tokens1);
  const s2 = new Set(tokens2);
  const intersection = [...s1].filter((x) => s2.has(x)).length;
  const union = new Set([...s1, ...s2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Returns true if two jobs from DIFFERENT sources look like the same position.
 * Uses Jaccard similarity on title tokens + company tokens.
 */
export function isDuplicate(a, b) {
  if (a.source === b.source) return false;

  const companySim = jaccard(tokenize(a.company), tokenize(b.company));
  if (companySim < 0.4) return false;

  const titleSim = jaccard(tokenize(a.title), tokenize(b.title));
  return titleSim >= 0.55;
}

/**
 * Find the first existing job that looks like a duplicate of `candidate`.
 * @param {{ source, title, company }} candidate
 * @param {Array<{ source, title, company }>} pool - recent jobs already in DB
 * @returns existing job or null
 */
export function findDuplicate(candidate, pool) {
  return pool.find((existing) => isDuplicate(candidate, existing)) ?? null;
}
