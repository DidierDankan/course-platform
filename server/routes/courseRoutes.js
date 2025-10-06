import express from "express";
import CourseController from "../controllers/CourseController.js";
// courseRoutes.js
import upload from "../middleware/uploadMiddleware.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/all', CourseController.getAllCourses);

// ✅ Require authentication for everything in this router
router.use(authenticate);

// ✅ Public read-only route? (Optional)
// If you want users to be able to SEE courses but not add/edit
router.get("/", CourseController.getCourses);
router.get("/:id/media", CourseController.getCourseMedia);

// ✅ Restricted to admin/seller
router.post(
  "/",
  authorizeRoles("admin", "seller"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 20 },
  ]),
  CourseController.addCourse // saves both course & media in one go
);
router.put(
  "/:id",
  authorizeRoles("admin", "seller"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 20 },
  ]),
  CourseController.updateCourse
);
router.delete("/:id", authorizeRoles("admin", "seller"), CourseController.deleteCourse);
router.delete("/media/:mediaId", authorizeRoles("admin", "seller"), CourseController.deleteMedia);

export default router;
