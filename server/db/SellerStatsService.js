// server/db/SellerStatsService.js
// A seller's own numbers for the dashboard: students and revenue per month for the last 12 months, and the courses
// with the most students. Everything is filtered on courses.seller_id, and only counts and sums leave this file:
// no student's name or email.
import db from "./connection.js";

export const STATS_MONTHS = 12;
export const TOP_COURSES = 5;

const monthKey = (date) => date.toISOString().slice(0, 7); // "2026-03", in UTC

// The 12 month keys ending with the current UTC month (oldest first), and the start of the oldest one in UTC.
export function statsWindow(now = new Date()) {
  const months = [];
  for (let back = STATS_MONTHS - 1; back >= 0; back -= 1) {
    months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1))));
  }
  return { months, since: `${months[0]}-01 00:00:00` };
}

// MySQL reads a TIMESTAMP in the session's time zone, so a sale at 23:30 UTC on 31 March could land in April on a
// server set to Central Europe. CONVERT_TZ to '+00:00' makes every month a UTC month (it works from the SYSTEM zone and
// from offsets without MySQL's time zone tables). The window start is converted on the parameter side, so the column
// itself stays as it is and its index can still be used. The column names here are fixed, never from a request.
const utcMonth = (column) => `DATE_FORMAT(CONVERT_TZ(${column}, @@session.time_zone, '+00:00'), '%Y-%m')`;
const inWindow = (column) => `${column} >= CONVERT_TZ(?, '+00:00', @@session.time_zone)`;

const money = (value) => Math.round(Number(value ?? 0) * 100) / 100; // mysql2 returns DECIMAL sums as text

class SellerStatsService {
  async statsFor(sellerId, now = new Date()) {
    const { months, since } = statsWindow(now);

    const [studentRows] = await db.query(
      `SELECT ${utcMonth("e.enrolled_at")} AS month, COUNT(*) AS students
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE c.seller_id = ? AND ${inWindow("e.enrolled_at")}
       GROUP BY month`,
      [sellerId, since]
    );

    // Only payments Stripe confirmed: pending, failed and canceled checkouts are not revenue.
    const [revenueRows] = await db.query(
      `SELECT ${utcMonth("p.payment_date")} AS month, SUM(p.amount) AS revenue
       FROM payments p
       JOIN courses c ON c.id = p.course_id
       WHERE c.seller_id = ? AND p.status = 'paid' AND ${inWindow("p.payment_date")}
       GROUP BY month`,
      [sellerId, since]
    );

    // Revenue comes from a subquery: joining enrollments and payments in one FROM would repeat each payment once per
    // enrollment and multiply the sum. Courses without a student in the window are left out.
    const [topRows] = await db.query(
      `SELECT c.id, c.title, COUNT(*) AS students,
              (SELECT COALESCE(SUM(p.amount), 0)
                 FROM payments p
                WHERE p.course_id = c.id AND p.status = 'paid' AND ${inWindow("p.payment_date")}) AS revenue
       FROM courses c
       JOIN enrollments e ON e.course_id = c.id
       WHERE c.seller_id = ? AND ${inWindow("e.enrolled_at")}
       GROUP BY c.id, c.title
       ORDER BY students DESC, revenue DESC, c.id ASC
       LIMIT ?`,
      [since, sellerId, since, TOP_COURSES]
    );

    const studentsBy = new Map(studentRows.map((row) => [row.month, Number(row.students)]));
    const revenueBy = new Map(revenueRows.map((row) => [row.month, money(row.revenue)]));
    const series = months.map((month) => ({
      month,
      students: studentsBy.get(month) ?? 0,
      revenue: revenueBy.get(month) ?? 0,
    }));

    return {
      months: series,
      topCourses: topRows.map((row) => ({
        id: row.id,
        title: row.title,
        students: Number(row.students),
        revenue: money(row.revenue),
      })),
      totals: {
        students: series.reduce((sum, m) => sum + m.students, 0),
        revenue: money(series.reduce((sum, m) => sum + m.revenue, 0)),
      },
    };
  }
}

export default new SellerStatsService();
