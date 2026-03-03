// server/db/EnrollmentService.js
import db from "./connection.js";

class EnrollmentService {
  async createEnrollment({ userId, courseId }) {
    // 1) course must exist + get owner
    const [courseRows] = await db.query(
      `SELECT seller_id FROM courses WHERE id = ? LIMIT 1`,
      [courseId]
    );

    const course = courseRows[0];
    if (!course) {
      throw new Error("Course not found.");
    }

    // 2) block seller enrolling in their own course
    if (Number(course.seller_id) === Number(userId)) {
      throw new Error("You cannot enroll in your own course.");
    }

    // 3) prevent duplicates
    const [exists] = await db.query(
      `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
      [userId, courseId]
    );
    if (exists.length) {
      throw new Error("User is already enrolled in this course.");
    }

    // 4) insert
    await db.query(
      `INSERT INTO enrollments (user_id, course_id, enrolled_at)
      VALUES (?, ?, NOW())`,
      [userId, courseId]
    );
  }

  async getEnrollmentsByUser(userId) {
    const [rows] = await db.query(
      `
      SELECT e.*, c.title, c.description, c.thumbnail_url, c.price
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
      `,
      [userId]
    );

    return rows;
  }

  async getEnrollment(userId, courseId) {
    const [rows] = await db.query(
      `SELECT *
       FROM enrollments
       WHERE user_id = ? AND course_id = ?
       LIMIT 1`,
      [userId, courseId]
    );

    return rows[0];
  }

  // server/db/EnrollmentService.js
  async updateProgress({ userId, courseId, progress, completed, lastWatchedMediaId, lastPositionSeconds }) {
    await db.query(
      `
      UPDATE enrollments
      SET progress = ?,
          completed = ?,
          last_watched_media_id = ?,
          last_position_seconds = ?,
          updated_at = NOW()
      WHERE user_id = ? AND course_id = ?
      `,
      [
        progress,
        completed ? 1 : 0,
        lastWatchedMediaId ?? null,
        lastPositionSeconds ?? 0,
        userId,
        courseId,
      ]
    );
  }

}

export default new EnrollmentService();