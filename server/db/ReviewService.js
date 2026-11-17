// server/db/ReviewService.js
// Course reviews: one per enrolled student per course (the unique key enforces it), never by the course's owner.
import db from "./connection.js";
import NotificationService from "./NotificationService.js";
import { withTransaction } from "./transaction.js";
import { httpError } from "../lib/answerError.js";
import { studentName } from "../lib/publicNames.js";

const average = (value) => (value === null || value === undefined ? null : Math.round(Number(value) * 100) / 100);

class ReviewService {
  // Returns "created" or "updated". 404: no such course; 403: the owner, or a user who isn't enrolled.
  // One transaction: a new review and the seller's notification are saved together or not at all (Stage 4c). Editing a
  // review doesn't notify again.
  async upsert({ courseId, userId, rating, body }) {
    return withTransaction(async (conn) => {
      const [[course]] = await conn.query("SELECT seller_id FROM courses WHERE id = ?", [courseId]);
      if (!course) throw httpError(404, "Course not found.");
      if (Number(course.seller_id) === Number(userId)) throw httpError(403, "You can't review your own course.");

      const [[enrollment]] = await conn.query("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
      if (!enrollment) throw httpError(403, "Only students enrolled in this course can review it.");

      // Looked up first (not from affectedRows, which is ambiguous when nothing changed). The unique key still decides:
      // two saves at once both end in one row.
      const [[existing]] = await conn.query("SELECT id FROM reviews WHERE user_id = ? AND course_id = ?", [userId, courseId]);
      const [result] = await conn.query(
        `INSERT INTO reviews (course_id, user_id, rating, body) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body)`,
        [courseId, userId, rating, body ? body : null]
      );
      if (existing) return "updated";

      await NotificationService.add(conn, {
        userId: course.seller_id,
        type: "review",
        courseId,
        sourceId: result.insertId,
        actorId: userId,
      });
      return "created";
    });
  }

  // Returns false if the user had no review on that course.
  async remove({ courseId, userId }) {
    const [result] = await db.query("DELETE FROM reviews WHERE user_id = ? AND course_id = ?", [userId, courseId]);
    return result.affectedRows > 0;
  }

  async mine({ courseId, userId }) {
    const [[row]] = await db.query(
      "SELECT id, rating, body, created_at, updated_at FROM reviews WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    return row ?? null;
  }

  // Newest first; id breaks ties so paging never repeats or skips a review. null if the course doesn't exist.
  async list({ courseId, limit, offset }) {
    const [[course]] = await db.query("SELECT id FROM courses WHERE id = ?", [courseId]);
    if (!course) return null;

    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.body, r.created_at, r.updated_at, up.full_name
       FROM reviews r
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       WHERE r.course_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [courseId, limit + 1, offset] // one extra row says whether there is a next page
    );
    const [[summary]] = await db.query("SELECT AVG(rating) AS average, COUNT(*) AS count FROM reviews WHERE course_id = ?", [courseId]);

    return {
      reviews: rows.slice(0, limit).map(({ full_name, ...review }) => ({ ...review, author: studentName(full_name) })),
      hasMore: rows.length > limit,
      summary: { average: average(summary.average), count: Number(summary.count) },
    };
  }
}

export default new ReviewService();
