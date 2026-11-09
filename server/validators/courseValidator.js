import { body } from "express-validator";

// Stripe refuses USD charges under $0.50 or over $999,999.99, so a price outside that range
// (other than free) would create a course nobody can buy.
const MIN_PAID_PRICE = 0.5;
const MAX_PRICE = 999999.99;
const MAX_TITLE_LENGTH = 255; // courses.title is VARCHAR(255)

export const courseValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: MAX_TITLE_LENGTH })
    .withMessage(`Title can be at most ${MAX_TITLE_LENGTH} characters`),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0, max: MAX_PRICE })
    .withMessage(`Price must be a number from 0 to ${MAX_PRICE}`)
    .bail()
    .custom((value) => Number(value) === 0 || Number(value) >= MIN_PAID_PRICE)
    .withMessage(`A paid course must cost at least ${MIN_PAID_PRICE.toFixed(2)}`),
];
