import { body } from "express-validator";
import { idParam } from "./idParam.js";
import { LIMITS, RATING_MAX, RATING_MIN } from "./limits.js";

// PUT /api/courses/:id/reviews. The rating is a whole number from 1 to 5 (isInt checks each item of an array, so an
// array is refused first); the text is optional, and an empty one is stored as no text.
export const reviewValidation = [
  idParam("id"),
  body("rating")
    .not()
    .isArray()
    .withMessage("Rating must be a single number")
    .bail()
    .isInt({ min: RATING_MIN, max: RATING_MAX })
    .withMessage(`Rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}`)
    .toInt(),
  body("body")
    .optional({ values: "null" })
    .isString()
    .withMessage("A review must be text")
    .bail()
    .trim()
    .isLength({ max: LIMITS.reviewBody })
    .withMessage(`A review can be at most ${LIMITS.reviewBody} characters`),
];

