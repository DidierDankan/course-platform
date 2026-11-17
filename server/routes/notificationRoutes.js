import express from "express";
import NotificationController from "../controllers/NotificationController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Sellers (and admins, who can own courses) are told about reviews and comments on their courses.
router.use(authenticate, authorizeRoles("seller", "admin"));

router.get("/", NotificationController.list);
router.get("/unread-count", NotificationController.unreadCount);
router.patch("/read", NotificationController.markAllRead);

export default router;
