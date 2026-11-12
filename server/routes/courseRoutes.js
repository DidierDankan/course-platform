import express from "express";
import CourseController from "../controllers/CourseController.js";
// courseRoutes.js
import upload from "../middleware/uploadMiddleware.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";
import { requireCourseOwner, requireMediaOwner } from "../middleware/courseOwnership.js";
import validateRequest from "../middleware/validateRequest.js";
import { courseValidation } from "../validators/courseValidator.js";
import { validId } from "../validators/idParam.js";

const router = express.Router();

router.get('/all', CourseController.getAllCourses);
router.get("/:id/public", validId("id"), CourseController.getPublicCourse);

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

export default router;
