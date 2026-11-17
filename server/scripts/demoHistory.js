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

// Reviews for the demo (Stage 4): every other sale gets one, a few days after the purchase (never after now).
// Mostly positive with some lower ones, so averages and "Top rated" look real rather than all 5.0.
const REVIEW_RATINGS = [5, 4, 5, 3, 4, 5, 2, 4];
const REVIEW_BODIES = [
  "Clear, calm and practical. I finished the first project in a weekend.",
  "Good pacing. I wanted a bit more detail in the second lesson.",
  null,
  "Exactly the level I needed: no fluff, lots of doing.",
  "Nice production. Some steps went too fast for a beginner.",
  null,
];
const REVIEW_DELAY_DAYS = 3;

// [{ learner, course, rating, body, at }] for a salesHistory() result.
export function reviewPlan(sales, now = new Date()) {
  return sales
    .filter((_, i) => i % 2 === 0)
    .map((sale, i) => ({
      learner: sale.learner,
      course: sale.course,
      rating: REVIEW_RATINGS[i % REVIEW_RATINGS.length],
      body: REVIEW_BODIES[i % REVIEW_BODIES.length],
      at: new Date(Math.min(sale.at.getTime() + REVIEW_DELAY_DAYS * 86_400_000, now.getTime())),
    }));
}
