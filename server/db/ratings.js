// server/db/ratings.js
// How every list and page computes a course's rating, in one place.
// Correlated subqueries, not a JOIN: joining reviews next to course_media would repeat each media row once per review
// and multiply total_duration (the same reason "popular" uses a subquery). The table alias is fixed code, never input.

export const ratingColumns = (course = "c") =>
  `(SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.course_id = ${course}.id) AS rating_avg,
   (SELECT COUNT(*) FROM reviews r WHERE r.course_id = ${course}.id) AS rating_count`;

// mysql2 returns DECIMAL as text: an average becomes a number (or null without reviews), a count an integer.
export const withRating = (row) => ({
  ...row,
  rating_avg: row.rating_avg === null || row.rating_avg === undefined ? null : Number(row.rating_avg),
  rating_count: Number(row.rating_count ?? 0),
});

// "Top rated" is a damped (Bayesian) average: every course starts with PRIOR_WEIGHT imaginary reviews at PRIOR_MEAN,
// so one 5-star review can't outrank two hundred at 4.8. (sum + W * M) / (count + W).
export const PRIOR_WEIGHT = 5;
export const PRIOR_MEAN = 3.5;
export const dampedRatingSql = (course = "c") =>
  `((SELECT COALESCE(SUM(r.rating), 0) FROM reviews r WHERE r.course_id = ${course}.id) + ${PRIOR_WEIGHT * PRIOR_MEAN})
   / ((SELECT COUNT(*) FROM reviews r WHERE r.course_id = ${course}.id) + ${PRIOR_WEIGHT})`;
