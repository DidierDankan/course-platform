import express from "express";
import CourseController from "../controllers/CourseController.js";
// courseRoutes.js
import upload from "../middleware/uploadMiddleware.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";
import { requireCourseOwner, requireMediaOwner } from "../middleware/courseOwnership.js";
import validateRequest from "../middleware/validateRequest.js";
import { courseListValidation, courseValidation } from "../validators/courseValidator.js";
import { validId } from "../validators/idParam.js";
import ReviewController from "../controllers/ReviewController.js";
import { reviewValidation } from "../validators/reviewValidator.js";
import CommentController from "../controllers/CommentController.js";
import { commentValidation } from "../validators/commentValidator.js";
import { authenticateOptional } from "../middleware/authOptional.js";

const router = express.Router();

router.get('/all', courseListValidation, validateRequest, CourseController.getAllCourses);
router.get("/:id/public", validId("id"), CourseController.getPublicCourse);
// Reviews are public to read (page and limit are clamped like the course lists)
router.get("/:id/reviews", validId("id"), ReviewController.list);
// Comments too; signed in, each one says whether the viewer may delete it
router.get("/:id/comments", validId("id"), authenticateOptional, CommentController.list);

// ✅ Require authentication for everything in this router
router.use(authenticate);

// ✅ Public read-only route? (Optional)
// If you want users to be able to SEE courses but not add/edit
router.get("/", CourseController.getCourses);
router.get("/:id/media", validId("id"), requireCourseOwner, CourseController.getCourseMedia);

// ✅ Restricted to admin/seller
router.post(
  "/",
  authorizeRoles("admin", "seller"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 20 },
  ]),
  courseValidation,
  validateRequest,
  CourseController.addCourse // saves both course & media in one go
);
router.put(
  "/:id",
  authorizeRoles("admin", "seller"),
  validId("id"),
  requireCourseOwner, // before upload, so refused requests don't save files
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 20 },
  ]),
  courseValidation,
  validateRequest,
  CourseController.updateCourse
);
router.delete("/:id", authorizeRoles("admin", "seller"), validId("id"), requireCourseOwner, CourseController.deleteCourse);
router.delete("/media/:mediaId", authorizeRoles("admin", "seller"), validId("mediaId"), requireMediaOwner, CourseController.deleteMedia);

router.get("/:id/watch", validId("id"), CourseController.watch);

// Writing a review: enrolled students only, never the owner (checked in ReviewService)
router.get("/:id/reviews/mine", validId("id"), ReviewController.mine);
router.put("/:id/reviews", reviewValidation, validateRequest, ReviewController.save);
router.delete("/:id/reviews", validId("id"), ReviewController.remove);

// Comments: enrolled students, the owner and admins post; the author, the owner or an admin deletes (CommentService)
router.post("/:id/comments", commentValidation, validateRequest, CommentController.create);
router.delete("/comments/:commentId", validId("commentId"), CommentController.remove);

export default router;
