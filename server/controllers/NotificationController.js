// server/controllers/NotificationController.js
// Every route reads and changes only the signed-in user's own notifications (user id from the session, never a param).
import NotificationService from "../db/NotificationService.js";
import { parsePagination } from "../lib/pagination.js";
import { answerError } from "../lib/answerError.js";

const NOTIFICATIONS_PAGE_SIZE = 20;

class NotificationController {
  // GET /api/notifications
  async list(req, res) {
    try {
      const { limit, offset, page } = parsePagination(req.query, { defaultLimit: NOTIFICATIONS_PAGE_SIZE });
      const result = await NotificationService.list({ userId: req.user.id, limit, offset });
      return res.json({ ...result, page });
    } catch (err) {
      return answerError(res, "List notifications", err);
    }
  }

  // GET /api/notifications/unread-count: what the header badge polls
  async unreadCount(req, res) {
    try {
      return res.json({ unread: await NotificationService.unreadCount(req.user.id) });
    } catch (err) {
      return answerError(res, "Unread notifications", err);
    }
  }

  // PATCH /api/notifications/read: marks all of the user's notifications as read
  async markAllRead(req, res) {
    try {
      await NotificationService.markAllRead(req.user.id);
      return res.json({ unread: 0 });
    } catch (err) {
      return answerError(res, "Mark notifications read", err);
    }
  }
}

export default new NotificationController();
