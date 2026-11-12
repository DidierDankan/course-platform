import FavoriteService from "../db/FavoriteService.js";
import { logError } from "../lib/logError.js";

class FavoriteController {
  async list(req, res) {
    try {
      const userId = req.user.id;
      const rows = await FavoriteService.listByUser(userId);
      res.json({ ok: true, favorites: rows });
    } catch (e) {
      logError("List favorites", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async add(req, res) {
    try {
      const userId = req.user.id;
      // courseIdBody already checked course_id (a positive whole number).
      const added = await FavoriteService.add({ userId, courseId: Number(req.body.course_id) });
      if (!added) return res.status(404).json({ ok: false, message: "Course not found" });
      res.status(201).json({ ok: true });
    } catch (e) {
      logError("Add favorite", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async remove(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);
      const removed = await FavoriteService.remove({ userId, courseId });
      res.json({ ok: true, removed: !!removed });
    } catch (e) {
      logError("Remove favorite", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async check(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);
      const favorited = await FavoriteService.isFavorited({ userId, courseId });
      res.json({ ok: true, favorited });
    } catch (e) {
      logError("Check favorite", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new FavoriteController();