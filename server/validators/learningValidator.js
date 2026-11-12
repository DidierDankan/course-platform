import { body } from "express-validator";
import { idRule, secondsRule } from "./fields.js";
import { idParam } from "./idParam.js";

// POST /api/enrollments, POST /api/favorites, POST /api/payments/checkout: the course comes in the body.
export const courseIdBody = [idRule(body("course_id"), "course_id")];

// PATCH /api/enrollments/:courseId. All three fields are optional (the player sends what it has).
// completed becomes a real boolean here: the service tests it with `completed ? 1 : 0`, so the text "false" would
// otherwise count as true. Whether the lesson belongs to this course is checked in the service (404 if not).
export const progressValidation = [
  idParam("courseId"),
  secondsRule(body("lastPositionSeconds").optional({ values: "null" }), "lastPositionSeconds"),
  idRule(body("lastWatchedMediaId").optional({ values: "null" }), "lastWatchedMediaId"),
  body("completed").optional().isBoolean().withMessage("completed must be true or false").bail().toBoolean(true),
];
