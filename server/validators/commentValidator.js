import { body } from "express-validator";
import { idParam } from "./idParam.js";
import { LIMITS } from "./limits.js";

// POST /api/courses/:id/comments. Plain text, 1 to 2000 characters after trimming (isString refuses arrays and objects).
export const commentValidation = [
  idParam("id"),
  body("body")
    .isString()
    .withMessage("A comment must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("A comment can't be empty")
    .isLength({ max: LIMITS.commentBody })
    .withMessage(`A comment can be at most ${LIMITS.commentBody} characters`),
];
