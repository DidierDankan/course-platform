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

  async updateProgress({
    userId,
    courseId,
    completed,
    lastWatchedMediaId,
    lastPositionSeconds,
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const mediaId = lastWatchedMediaId ? Number(lastWatchedMediaId) : null;
      const seconds = Number.isFinite(Number(lastPositionSeconds))
        ? Math.max(0, Math.floor(Number(lastPositionSeconds)))
        : 0;

      // 1) Always update enrollment resume pointer
      await conn.query(
        `
        UPDATE enrollments
        SET last_watched_media_id = ?,
            last_position_seconds = ?,
            updated_at = NOW()
        WHERE user_id = ? AND course_id = ?
        `,
        [mediaId, seconds, userId, courseId]
      );

      // 2) Upsert lesson_progress for the current lesson (course_media_id)
      if (mediaId) {
        const isCompleted = completed ? 1 : 0;

        await conn.query(
          `
          INSERT INTO lesson_progress
            (user_id, course_media_id, completed, completed_at, last_position_seconds, updated_at)
          VALUES
            (?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            completed = GREATEST(completed, VALUES(completed)),
            completed_at = CASE
              WHEN GREATEST(completed, VALUES(completed)) = 1
              THEN COALESCE(completed_at, VALUES(completed_at))
              ELSE completed_at
            END,
            last_position_seconds = VALUES(last_position_seconds),
            updated_at = NOW()
          `,
          [
            userId,
            mediaId,
            isCompleted,
            isCompleted ? new Date() : null,
            isCompleted ? 0 : seconds,
          ]
        );
      }

      // 3) Compute COURSE progress from lesson_progress (completed lessons / total lessons)
      const [[tot]] = await conn.query(
        `SELECT COUNT(*) AS total
         FROM course_media
         WHERE course_id = ? AND type = 'video'`,
        [courseId]
      );

      const [[done]] = await conn.query(
        `SELECT COUNT(*) AS done
         FROM lesson_progress lp
         JOIN course_media cm ON cm.id = lp.course_media_id
         WHERE lp.user_id = ?
           AND cm.course_id = ?
           AND cm.type = 'video'
           AND lp.completed = 1`,
        [userId, courseId]
      );

      const total = Number(tot.total) || 0;
      const doneCount = Number(done.done) || 0;

      const courseProgress = total ? Math.floor((doneCount / total) * 100) : 0;
      const courseCompleted = total > 0 && doneCount >= total ? 1 : 0;

      // 4) Save COURSE progress into enrollments.progress
      await conn.query(
        `
        UPDATE enrollments
        SET progress = ?,
            completed = ?,
            updated_at = NOW()
        WHERE user_id = ? AND course_id = ?
        `,
        [courseProgress, courseCompleted, userId, courseId]
      );

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

}

export default new EnrollmentService();