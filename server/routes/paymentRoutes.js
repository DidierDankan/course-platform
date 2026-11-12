import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { courseIdBody } from "../validators/learningValidator.js";

const router = express.Router();

router.post("/checkout", authenticate, courseIdBody, validateRequest, PaymentController.createCheckoutSession.bind(PaymentController));

export default router;