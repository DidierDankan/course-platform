import { body } from "express-validator";

// A Stripe Checkout Session id ("cs_test_..." / "cs_live_..."). Checked before Stripe is asked, so garbage never costs
// an API call. isString refuses arrays and objects. 255 = payments.stripe_session_id VARCHAR(255).
const CHECKOUT_SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;
const MAX_SESSION_ID = 255;

export const confirmPaymentValidation = [
  body("session_id")
    .isString()
    .withMessage("session_id is required")
    .bail()
    .isLength({ max: MAX_SESSION_ID })
    .withMessage("session_id is too long")
    .bail()
    .matches(CHECKOUT_SESSION_ID)
    .withMessage("session_id must be a Stripe Checkout session id"),
];
