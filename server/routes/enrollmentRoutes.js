import express from "express";
import EnrollmentController from "../controllers/EnrollmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Protect all enrollment routes
router.use(authenticate);

router.post("/", EnrollmentController.enroll);
router.get("/", EnrollmentController.listUserEnrollments);
router.get("/:courseId", EnrollmentController.checkEnrollment);
router.patch("/:courseId", EnrollmentController.updateProgress);

export default router;
