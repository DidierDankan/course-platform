import express from "express";
import FavoriteController from "../controllers/FavoriteController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { validId } from "../validators/idParam.js";
import { courseIdBody } from "../validators/learningValidator.js";

const router = express.Router();
router.use(authenticate);

router.get("/", FavoriteController.list);
router.post("/", courseIdBody, validateRequest, FavoriteController.add);
router.get("/:courseId", validId("courseId"), FavoriteController.check);
router.delete("/:courseId", validId("courseId"), FavoriteController.remove);

export default router;