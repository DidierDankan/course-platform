import express from "express";
import EnrollmentController from "../controllers/EnrollmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { courseIdBody, progressValidation } from "../validators/learningValidator.js";

const router = express.Router();

// 🔒 Protect all enrollment routes
router.use(authenticate);

router.post("/", courseIdBody, validateRequest, EnrollmentController.enroll);
router.get("/", EnrollmentController.listUserEnrollments);
router.patch("/:courseId", progressValidation, validateRequest, EnrollmentController.updateProgress);

export default router;
