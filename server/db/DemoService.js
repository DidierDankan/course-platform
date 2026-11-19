// server/db/DemoService.js
// The public demo (seed:demo). Its password is shown on the login page, so:
//   - isDemoAccount: the guard (middleware/demoAccount.js) refuses the writes that would break the demo for the next
//     visitor (courses, lessons, profile);
//   - rebuildActivity: puts back everything visitors MAY change (purchases, progress, favorites, reviews, comments,
//     notifications). seed:demo runs it after writing the courses; resetIfDue runs it from the server once a day.
// Courses, lessons and files are never touched here: the guard keeps them as the seed left them.
import db from "./connection.js";
import { withTransaction } from "./transaction.js";
import {
  DEMO_COURSES,
  DEMO_INSTRUCTOR_EMAIL,
  DEMO_STUDENT_EMAIL,
  ENROLLED_COURSE,
  FAVORITE_COURSE,
  STUDENT_PROGRESS,
} from "../lib/demoContent.js";
import { DEMO_LEARNERS, UNREAD_DEMO_NOTIFICATIONS, commentPlan, learnerEmail, reviewPlan, salesHistory } from "../lib/demoHistory.js";

const LEARNER_EMAILS = Array.from({ length: DEMO_LEARNERS }, (_, i) => learnerEmail(i + 1));
const NEVER = new Date("2000-01-01T00:00:00Z"); // the first reset is always due
const toUnix = (date) => Math.floor(date.getTime() / 1000);

class DemoService {
  async isDemoAccount(userId) {
    const [[row]] = await db.query("SELECT is_demo FROM users WHERE id = ?", [userId]);
    return Number(row?.is_demo) === 1;
  }

  // The ids of what the seed created, or null when the seed hasn't run here (then there is nothing to reset).
  // demo = { sellerId, studentId, learnerIds, courseIds, firstLessonIds }, courseIds in DEMO_COURSES order.
  async findDemo(q = db) {
    const [users] = await q.query("SELECT id, email FROM users WHERE is_demo = 1 AND email IN (?)", [
      [DEMO_INSTRUCTOR_EMAIL, DEMO_STUDENT_EMAIL, ...LEARNER_EMAILS],
    ]);
    const idOf = new Map(users.map((u) => [u.email, u.id]));
    const sellerId = idOf.get(DEMO_INSTRUCTOR_EMAIL);
    const studentId = idOf.get(DEMO_STUDENT_EMAIL);
    const learnerIds = LEARNER_EMAILS.map((email) => idOf.get(email));
    if (!sellerId || !studentId || learnerIds.some((id) => !id)) return null;

    const [courses] = await q.query("SELECT id, title FROM courses WHERE seller_id = ? AND title IN (?)", [
      sellerId,
      DEMO_COURSES.map((c) => c.title),
    ]);
    const courseOf = new Map(courses.map((c) => [c.title, c.id]));
    const courseIds = DEMO_COURSES.map((c) => courseOf.get(c.title));
    if (courseIds.some((id) => !id)) return null;

    const [lessons] = await q.query(
      "SELECT course_id, id FROM course_media WHERE course_id IN (?) AND type = 'video' AND order_index = 1",
      [courseIds]
    );
    const lessonOf = new Map(lessons.map((l) => [l.course_id, l.id]));
    const firstLessonIds = courseIds.map((id) => lessonOf.get(id));
    if (firstLessonIds.some((id) => !id)) return null;

    return { sellerId, studentId, learnerIds, courseIds, firstLessonIds };
  }

  // Run inside a transaction (q = its connection). Removes what anyone did with the demo accounts, and every review and
  // comment on the demo courses (also from visitors' own accounts: the demo is a showroom), then writes the seeded
  // activity again and records the time.
  async rebuildActivity(q, demo, now = new Date()) {
    const accounts = [demo.sellerId, demo.studentId, ...demo.learnerIds];
    // notifications.source_id points at a review or comment without a foreign key: clear them first, explicitly
    await q.query("DELETE FROM notifications WHERE user_id IN (?) OR actor_id IN (?)", [accounts, accounts]);
    await q.query("DELETE FROM comments WHERE user_id IN (?) OR course_id IN (?)", [accounts, demo.courseIds]);
    await q.query("DELETE FROM reviews WHERE user_id IN (?) OR course_id IN (?)", [accounts, demo.courseIds]);
    await q.query("DELETE FROM favorites WHERE user_id IN (?)", [accounts]);
    await q.query("DELETE FROM lesson_progress WHERE user_id IN (?)", [accounts]);
    await q.query("DELETE FROM enrollments WHERE user_id IN (?)", [accounts]);
    await q.query("DELETE FROM payments WHERE user_id IN (?)", [accounts]);

    await this.#writeActivity(q, demo, now);
    await q.query(
      "INSERT INTO demo_resets (id, last_reset_at) VALUES (1, ?) ON DUPLICATE KEY UPDATE last_reset_at = VALUES(last_reset_at)",
      [now]
    );
  }

  // Resets the demo when the last reset is older than maxAgeMs. The demo_resets row is locked for the whole reset, so
  // two servers (or two timers) never reset at once: the second waits, then sees the new time and does nothing.
  // Answers { reset: true } or { reset: false, reason: "not due" | "no demo data" }.
  async resetIfDue({ now = new Date(), maxAgeMs }) {
    return withTransaction(async (conn) => {
      await conn.query("INSERT IGNORE INTO demo_resets (id, last_reset_at) VALUES (1, ?)", [NEVER]);
      const [[row]] = await conn.query("SELECT last_reset_at FROM demo_resets WHERE id = 1 FOR UPDATE");
      if (now.getTime() - new Date(row.last_reset_at).getTime() < maxAgeMs) return { reset: false, reason: "not due" };

      const demo = await this.findDemo(conn);
      if (!demo) return { reset: false, reason: "no demo data" };
      await this.rebuildActivity(conn, demo, now);
      return { reset: true };
    });
  }

  // The seeded activity: the student's half-done course and favorite, a year of sales, reviews, comments and the
  // instructor's notifications. Called on empty tables (rebuildActivity clears them first).
  async #writeActivity(q, demo, now) {
    const { sellerId, studentId, learnerIds, courseIds, firstLessonIds } = demo;

    await q.query("INSERT INTO enrollments (user_id, course_id, progress, last_watched_media_id) VALUES (?, ?, ?, ?)", [
      studentId,
      courseIds[ENROLLED_COURSE],
      STUDENT_PROGRESS,
      firstLessonIds[ENROLLED_COURSE],
    ]);
    // Same columns the server writes (EnrollmentService.updateProgress).
    await q.query("INSERT INTO lesson_progress (user_id, course_media_id, completed, completed_at) VALUES (?, ?, 1, ?)", [
      studentId,
      firstLessonIds[ENROLLED_COURSE],
      now,
    ]);
    await q.query("INSERT INTO favorites (user_id, course_id) VALUES (?, ?)", [studentId, courseIds[FAVORITE_COURSE]]);

    // Sales history: the rows checkout + the webhook write (a paid payment and its enrollment), dated in the past.
    const sales = salesHistory(now);
    for (const sale of sales) {
      const userId = learnerIds[sale.learner];
      const courseId = courseIds[sale.course];
      await q.query(
        `INSERT INTO payments (user_id, course_id, status, amount, stripe_session_id, payment_date)
         VALUES (?, ?, 'paid', ?, ?, FROM_UNIXTIME(?))`,
        [userId, courseId, DEMO_COURSES[sale.course].price, `cs_demo_${userId}_${courseId}`, toUnix(sale.at)]
      );
      await q.query("INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, FROM_UNIXTIME(?))", [
        userId,
        courseId,
        toUnix(sale.at),
      ]);
    }

    // Reviews from some of those buyers, dated a few days after the purchase.
    const events = []; // what the instructor is told about, like the app does inside each save
    for (const r of reviewPlan(sales, now)) {
      const [res] = await q.query(
        `INSERT INTO reviews (course_id, user_id, rating, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`,
        [courseIds[r.course], learnerIds[r.learner], r.rating, r.body, toUnix(r.at), toUnix(r.at)]
      );
      events.push({ type: "review", course: r.course, sourceId: res.insertId, actorId: learnerIds[r.learner], at: r.at });
    }

    const discussion = commentPlan(sales, now);
    for (const c of discussion.comments) {
      const [res] = await q.query("INSERT INTO comments (course_id, user_id, body, created_at) VALUES (?, ?, ?, FROM_UNIXTIME(?))", [
        courseIds[c.course],
        learnerIds[c.learner],
        c.body,
        toUnix(c.at),
      ]);
      events.push({ type: "comment", course: c.course, sourceId: res.insertId, actorId: learnerIds[c.learner], at: c.at });
    }
    if (discussion.answer) {
      // the instructor's own comment notifies no one
      await q.query("INSERT INTO comments (course_id, user_id, body, created_at) VALUES (?, ?, ?, FROM_UNIXTIME(?))", [
        courseIds[discussion.answer.course],
        sellerId,
        discussion.answer.body,
        toUnix(discussion.answer.at),
      ]);
    }

    events.sort((a, b) => b.at - a.at);
    for (const [i, e] of events.entries()) {
      await q.query(
        `INSERT INTO notifications (user_id, type, course_id, source_id, actor_id, created_at, read_at)
         VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?)`,
        [sellerId, e.type, courseIds[e.course], e.sourceId, e.actorId, toUnix(e.at), i < UNREAD_DEMO_NOTIFICATIONS ? null : e.at]
      );
    }
  }
}

export default new DemoService();
