import db from "./connection.js";

class FavoriteService {
  async listByUser(userId) {
    const [rows] = await db.query(
      `
      SELECT 
        f.course_id,
        f.favorited_at,
        c.title, c.description, c.price, c.seller_id, c.created_at,
        MAX(CASE WHEN m.type = 'image' THEN m.url END) AS thumbnail_url,
        COALESCE(SUM(CASE WHEN m.type = 'video' THEN m.duration END), 0) AS total_duration
      FROM favorites f
      JOIN courses c ON c.id = f.course_id
      LEFT JOIN course_media m ON m.course_id = c.id
      WHERE f.user_id = ?
      GROUP BY f.course_id
      ORDER BY f.favorited_at DESC
      `,
      [userId]
    );
    return rows;
  }

  async add({ userId, courseId }) {
    await db.query(
      `INSERT INTO favorites (user_id, course_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE favorited_at = NOW()`,
      [userId, courseId]
    );
  }

  async remove({ userId, courseId }) {
    const [res] = await db.query(
      `DELETE FROM favorites WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    return res.affectedRows;
  }

  async isFavorited({ userId, courseId }) {
    const [[row]] = await db.query(
      `SELECT 1 AS ok FROM favorites WHERE user_id=? AND course_id=? LIMIT 1`,
      [userId, courseId]
    );
    return !!row?.ok;
  }
}

export default new FavoriteService();