// Human-readable length from a number of seconds, shared by cards, the course editor and the preview page.
// The two largest non-zero units only:  30 -> "30s", 90 -> "1m 30s", 3600 -> "1h", 3700 -> "1h 1m".
// Missing, negative or non-numeric input -> "0s" (a course with no videos yet).
export function formatDuration(totalSeconds) {
  const seconds = Math.floor(Number(totalSeconds));
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}
