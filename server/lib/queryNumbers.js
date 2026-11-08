// server/lib/queryNumbers.js
// Query-string numbers are untrusted text. Anything that isn't a real number >= 0 counts as "not sent",
// so a hand-edited or stale shared URL still gets a normal list instead of an error or a NaN in the query.
export function nonNegativeOrUndefined(value) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
