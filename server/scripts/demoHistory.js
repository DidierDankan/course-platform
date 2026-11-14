// server/scripts/demoHistory.js
// Used by seed-demo.js. Its own module so a test can check the plan without running the seed.

// A year of sales for the seller dashboard's charts: demo learners who bought courses, more each quarter.
// Deterministic (the same rows every run) and dated back from the current month, so a re-run keeps the history inside
// the dashboard's last 12 months. Each learner buys a course at most once (enrollments and payments are unique per pair).
export const DEMO_LEARNERS = 24;
export const HISTORY_MONTHS = 12;
// Indexes into seed-demo.js's COURSES (4 courses): course 1 sells best.
const COURSE_POPULARITY = [1, 0, 1, 2, 1, 3, 0, 1, 2, 1];
export const learnerEmail = (n) => `demo-learner-${String(n).padStart(2, "0")}@lumen.test`;

// [{ learner, course, at: Date }]: 1 sale a month in the oldest quarter, then 2, 3 and 4 a month.
export function salesHistory(now = new Date()) {
  const sales = [];
  const taken = new Set();
  let k = 0;
  for (let monthsAgo = HISTORY_MONTHS - 1; monthsAgo >= 0; monthsAgo -= 1) {
    const perMonth = 1 + Math.floor((HISTORY_MONTHS - 1 - monthsAgo) / 3);
    for (let n = 0; n < perMonth; n += 1, k += 1) {
      const course = COURSE_POPULARITY[k % COURSE_POPULARITY.length];
      let learner = k % DEMO_LEARNERS;
      while (taken.has(`${learner}:${course}`)) learner = (learner + 1) % DEMO_LEARNERS;
      taken.add(`${learner}:${course}`);
      // a day and hour in that month, in UTC; in the current month, never after today
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() - monthsAgo;
      const day = monthsAgo === 0 ? Math.min(1 + ((k * 7) % 24), now.getUTCDate()) : 1 + ((k * 7) % 24);
      const at = Date.UTC(year, month, day, 9 + (k % 9), 15);
      sales.push({ learner, course, at: new Date(Math.min(at, now.getTime())) }); // today, but never later than now
    }
  }
  return sales;
}
