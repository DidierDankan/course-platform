import express from "express";
import FavoriteController from "../controllers/FavoriteController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticate);

router.get("/", FavoriteController.list);
router.post("/", FavoriteController.add);
router.get("/:courseId", FavoriteController.check); // optional
router.delete("/:courseId", FavoriteController.remove);

export default router;