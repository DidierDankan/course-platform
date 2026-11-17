// server/controllers/ReviewController.js
import ReviewService from "../db/ReviewService.js";
import { parsePagination } from "../lib/pagination.js";
import { answerError } from "../lib/answerError.js";

const REVIEWS_PAGE_SIZE = 10;

class ReviewController {
  // GET /api/courses/:id/reviews (public)
  async list(req, res) {
    try {
      const { limit, offset, page } = parsePagination(req.query, { defaultLimit: REVIEWS_PAGE_SIZE });
      const result = await ReviewService.list({ courseId: Number(req.params.id), limit, offset });
      if (!result) return res.status(404).json({ message: "Course not found" });
      return res.json({ ...result, page });
    } catch (err) {
      return answerError(res, "List reviews", err);
    }
  }

  // GET /api/courses/:id/reviews/mine: the signed-in user's own review, to fill the form (null if none)
  async mine(req, res) {
    try {
      const review = await ReviewService.mine({ courseId: Number(req.params.id), userId: req.user.id });
      return res.json({ review });
    } catch (err) {
      return answerError(res, "My review", err);
    }
  }

  // PUT /api/courses/:id/reviews: create or replace the user's review. 201 when new, 200 when it replaced one.
  async save(req, res) {
    try {
      const courseId = Number(req.params.id);
      const outcome = await ReviewService.upsert({
        courseId,
        userId: req.user.id,
        rating: req.body.rating,
        body: req.body.body,
      });
      const review = await ReviewService.mine({ courseId, userId: req.user.id });
      return res.status(outcome === "created" ? 201 : 200).json({ review });
    } catch (err) {
      return answerError(res, "Save review", err);
    }
  }

  // DELETE /api/courses/:id/reviews: the user's own review only
  async remove(req, res) {
    try {
      const removed = await ReviewService.remove({ courseId: Number(req.params.id), userId: req.user.id });
      if (!removed) return res.status(404).json({ message: "You have no review on this course" });
      return res.json({ message: "Review deleted" });
    } catch (err) {
      return answerError(res, "Delete review", err);
    }
  }
}

export default new ReviewController();
