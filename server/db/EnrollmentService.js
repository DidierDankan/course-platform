import db from "./connection.js";

const EnrollmentService = {
  async createEnrollment({ userId, courseId }) {
    const [exists] = await db.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (exists.length > 0) {
      throw new Error("User is already enrolled in this course.");
    }

    await db.query(
      "INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, NOW())",
      [userId, courseId]
    );
  },

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
  },

  async getEnrollment(userId, courseId) {
    const [rows] = await db.query(
      "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1",
      [userId, courseId]
    );
    return rows[0];
  },

  async updateProgress({ userId, courseId, progress, completed }) {
    await db.query(
      `
      UPDATE enrollments
      SET progress = ?, completed = ?, updated_at = NOW()
      WHERE user_id = ? AND course_id = ?
      `,
      [progress, completed ? 1 : 0, userId, courseId]
    );
  },
};

export default EnrollmentService;
