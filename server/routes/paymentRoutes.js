import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { courseIdBody } from "../validators/learningValidator.js";
import { confirmPaymentValidation } from "../validators/paymentValidator.js";

const router = express.Router();

router.post("/checkout", authenticate, courseIdBody, validateRequest, PaymentController.createCheckoutSession.bind(PaymentController));
// The buyer's return from Stripe also records the purchase (the webhook stays the backup): see confirmPayment.
router.post("/confirm", authenticate, confirmPaymentValidation, validateRequest, PaymentController.confirmPayment.bind(PaymentController));

export default router;