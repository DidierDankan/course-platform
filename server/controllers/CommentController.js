// server/controllers/CommentController.js
import CommentService from "../db/CommentService.js";
import { parsePagination } from "../lib/pagination.js";
import { answerError } from "../lib/answerError.js";

const COMMENTS_PAGE_SIZE = 20;

class CommentController {
  // GET /api/courses/:id/comments (public; signed in, each comment says whether the viewer may delete it)
  async list(req, res) {
    try {
      const { limit, offset, page } = parsePagination(req.query, { defaultLimit: COMMENTS_PAGE_SIZE });
      const result = await CommentService.list({ courseId: Number(req.params.id), limit, offset, viewer: req.user });
      if (!result) return res.status(404).json({ message: "Course not found" });
      return res.json({ ...result, page });
    } catch (err) {
      return answerError(res, "List comments", err);
    }
  }

  // POST /api/courses/:id/comments
  async create(req, res) {
    try {
      const comment = await CommentService.create({ courseId: Number(req.params.id), user: req.user, body: req.body.body });
      return res.status(201).json({ comment });
    } catch (err) {
      return answerError(res, "Post comment", err);
    }
  }

  // DELETE /api/courses/comments/:commentId
  async remove(req, res) {
    try {
      await CommentService.remove({ commentId: Number(req.params.commentId), user: req.user });
      return res.json({ message: "Comment deleted" });
    } catch (err) {
      return answerError(res, "Delete comment", err);
    }
  }
}

export default new CommentController();
