import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import SellerStatsController from "../controllers/SellerStatsController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/me/dashboard",
  authenticate,
  authorizeRoles("user"), // or ("user","seller") if you want both
  DashboardController.getMyDashboard
);

// The seller's own students and revenue (an admin sees the numbers of the courses they own, like any seller).
router.get("/seller/stats", authenticate, authorizeRoles("seller", "admin"), SellerStatsController.getMyStats);

export default router;
