import FavoriteService from "../db/FavoriteService.js";

class FavoriteController {
  async list(req, res) {
    try {
      const userId = req.user.id;
      const rows = await FavoriteService.listByUser(userId);
      res.json({ ok: true, favorites: rows });
    } catch (e) {
      console.error("favorites list error:", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async add(req, res) {
    try {
      const userId = req.user.id;
      const { course_id } = req.body;
      if (!course_id) return res.status(400).json({ ok: false, message: "course_id is required" });

      await FavoriteService.add({ userId, courseId: Number(course_id) });
      res.status(201).json({ ok: true });
    } catch (e) {
      console.error("favorites add error:", e);
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
      console.error("favorites remove error:", e);
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
      console.error("favorites check error:", e);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new FavoriteController();