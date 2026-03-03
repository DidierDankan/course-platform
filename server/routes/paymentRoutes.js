import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", authenticate, PaymentController.createCheckoutSession.bind(PaymentController));

export default router;