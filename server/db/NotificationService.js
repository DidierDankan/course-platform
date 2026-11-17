// server/db/NotificationService.js
// Sellers' notifications about new reviews and comments. add() takes the caller's transaction connection, so the
// notification is saved with the review or comment it announces, or not at all.
import db from "./connection.js";
import { TEAM_NAME, studentName } from "../lib/publicNames.js";

class NotificationService {
  // Inside the caller's transaction. Nobody is told about their own action, and a course without a seller tells no one.
  async add(conn, { userId, type, courseId, sourceId, actorId }) {
    if (!userId || Number(userId) === Number(actorId)) return;
    await conn.query(
      "INSERT INTO notifications (user_id, type, course_id, source_id, actor_id) VALUES (?, ?, ?, ?, ?)",
      [userId, type, courseId, sourceId, actorId]
    );
  }

  // The user's own notifications, newest first; id breaks ties so paging never repeats or skips.
  async list({ userId, limit, offset }) {
    const [rows] = await db.query(
      `SELECT n.id, n.type, n.course_id, c.title AS course_title, n.created_at, n.read_at,
              au.role AS actor_role, ap.full_name AS actor_name, r.rating
       FROM notifications n
       JOIN courses c ON c.id = n.course_id
       LEFT JOIN users au ON au.id = n.actor_id
       LEFT JOIN user_profiles ap ON ap.user_id = n.actor_id
       LEFT JOIN reviews r ON n.type = 'review' AND r.id = n.source_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT ? OFFSET ?`,
      [userId, limit + 1, offset]
    );
    return {
      notifications: rows.slice(0, limit).map((row) => ({
        id: row.id,
        type: row.type,
        course_id: row.course_id,
        course_title: row.course_title,
        actor: row.actor_role === "admin" ? TEAM_NAME : studentName(row.actor_name),
        rating: row.rating ?? null, // null for comments, and for a review deleted since
        created_at: row.created_at,
        read: row.read_at !== null,
      })),
      hasMore: rows.length > limit,
    };
  }

  async unreadCount(userId) {
    const [[row]] = await db.query("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL", [userId]);
    return Number(row.n);
  }

  async markAllRead(userId) {
    await db.query("UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL", [userId]);
  }
}

export default new NotificationService();
