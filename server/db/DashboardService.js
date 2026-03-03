// server/db/DashboardService.js
import db from "./connection.js";

class DashboardService {
  async getDashboardData(userId) {
    // Stats
    const [statsRows] = await db.query(
      `SELECT 
         COUNT(*) AS enrolled,
         COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) AS completed
       FROM enrollments
       WHERE user_id = ?`,
      [userId]
    );

    // My courses (preview)
    const [myCourses] = await db.query(
      `SELECT 
          e.course_id,
          e.progress,
          e.completed,
          e.last_watched_media_id,
          e.updated_at,
          c.title,
          c.price
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ?
       ORDER BY e.updated_at DESC
       LIMIT 6`,
      [userId]
    );

    // Favorites (preview)
    const [favorites] = await db.query(
      `SELECT 
          f.course_id,
          c.title,
          c.price
       FROM favorites f
       JOIN courses c ON c.id = f.course_id
       WHERE f.user_id = ?
       ORDER BY f.id DESC
       LIMIT 6`,
      [userId]
    );

    const continueLearning = myCourses.length ? myCourses[0] : null;

    return {
      stats: statsRows[0] || { enrolled: 0, completed: 0 },
      continueLearning,
      myCourses,
      favorites,
    };
  }
}

export default new DashboardService();