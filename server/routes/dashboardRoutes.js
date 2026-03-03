import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/me/dashboard",
  authenticate,
  authorizeRoles("user"), // or ("user","seller") if you want both
  DashboardController.getMyDashboard
);

export default router;