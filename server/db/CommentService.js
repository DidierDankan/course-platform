// server/db/CommentService.js
// Comments per course: an open discussion on the watch page. Posting: enrolled students, the course's owner, admins.
// Deleting: the author, the course's owner, admins. Reading is public; names follow lib/publicNames.js.
import db from "./connection.js";
import NotificationService from "./NotificationService.js";
import { withTransaction } from "./transaction.js";
import { httpError } from "../lib/answerError.js";
import { TEAM_NAME, instructorName, studentName } from "../lib/publicNames.js";

const isAdmin = (user) => user?.role === "admin";
const manages = (user, sellerId) => isAdmin(user) || Number(user?.id) === Number(sellerId);

// One comment as the client sees it. canDelete tells the viewer's page whether to show the button; the server checks
// again on delete.
const present = (row, sellerId, viewer) => {
  const byInstructor = Number(row.user_id) === Number(sellerId);
  let author = studentName(row.full_name);
  if (byInstructor) author = instructorName(row.full_name);
  else if (row.role === "admin") author = TEAM_NAME;
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author,
    isInstructor: byInstructor,
    canDelete: Boolean(viewer) && (Number(viewer.id) === Number(row.user_id) || manages(viewer, sellerId)),
  };
};

const SELECT_COMMENT = `SELECT cm.id, cm.user_id, cm.body, cm.created_at, u.role, up.full_name
  FROM comments cm
  JOIN users u ON u.id = cm.user_id
  LEFT JOIN user_profiles up ON up.user_id = cm.user_id`;

class CommentService {
  // Returns the new comment (as present() shows it). 404: no such course; 403: not enrolled and not the owner/admin.
  async create({ courseId, user, body }) {
    const id = await withTransaction(async (conn) => {
      const [[course]] = await conn.query("SELECT seller_id FROM courses WHERE id = ?", [courseId]);
      if (!course) throw httpError(404, "Course not found.");
      if (!manages(user, course.seller_id)) {
        const [[enrollment]] = await conn.query("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [user.id, courseId]);
        if (!enrollment) throw httpError(403, "Only students enrolled in this course can comment.");
      }
      const [result] = await conn.query("INSERT INTO comments (course_id, user_id, body) VALUES (?, ?, ?)", [courseId, user.id, body]);
      // The seller hears about it in the same transaction (Stage 4c); their own comments tell no one.
      await NotificationService.add(conn, {
        userId: course.seller_id,
        type: "comment",
        courseId,
        sourceId: result.insertId,
        actorId: user.id,
      });
      return result.insertId;
    });
    const [[row]] = await db.query(`${SELECT_COMMENT} WHERE cm.id = ?`, [id]);
    const [[course]] = await db.query("SELECT seller_id FROM courses WHERE id = ?", [courseId]);
    return present(row, course.seller_id, user);
  }

  // Newest first; id breaks ties so paging never repeats or skips. null if the course doesn't exist.
  async list({ courseId, limit, offset, viewer }) {
    const [[course]] = await db.query("SELECT seller_id FROM courses WHERE id = ?", [courseId]);
    if (!course) return null;
    const [rows] = await db.query(
      `${SELECT_COMMENT}
       WHERE cm.course_id = ?
       ORDER BY cm.created_at DESC, cm.id DESC
       LIMIT ? OFFSET ?`,
      [courseId, limit + 1, offset] // one extra row says whether there is a next page
    );
    return {
      comments: rows.slice(0, limit).map((row) => present(row, course.seller_id, viewer)),
      hasMore: rows.length > limit,
    };
  }

  // 404: no such comment; 403: not the author, the course's owner or an admin.
  async remove({ commentId, user }) {
    const [[row]] = await db.query(
      "SELECT cm.user_id, c.seller_id FROM comments cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = ?",
      [commentId]
    );
    if (!row) throw httpError(404, "Comment not found.");
    if (Number(row.user_id) !== Number(user.id) && !manages(user, row.seller_id)) {
      throw httpError(403, "You can only delete your own comments.");
    }
    await db.query("DELETE FROM comments WHERE id = ?", [commentId]);
  }
}

export default new CommentService();
