// Helpers shared by the dashboard charts.

// The server sends months as "2026-03", counted in UTC, so they are read in UTC too: in a time zone behind UTC,
// "2026-03-01" read locally would be shown as February.
const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const toDate = (monthKey) => new Date(`${monthKey}-01T00:00:00Z`);

export const monthShort = (monthKey) => shortMonth.format(toDate(monthKey)); // "Mar"
export const monthLong = (monthKey) => longMonth.format(toDate(monthKey)); // "March 2026"

// A round top for the y-axis (1, 2, 2.5, 5 or 10 times a power of ten), so the gridline labels are clean numbers.
// An all-zero series still gets an axis from 0 to 1, so the chart keeps its shape.
export function niceMax(value) {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value);
  return step * magnitude;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
// Axis ticks: in full under 10,000, compact above (12K).
export const tickNumber = (value) => (value < 10_000 ? value.toLocaleString("en-US") : compact.format(value));
