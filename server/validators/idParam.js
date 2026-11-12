import { param } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";
import { INT_MAX } from "./limits.js";

// Route ids (:id, :mediaId) arrive as text. Without a check, "abc" becomes NaN in the handler and reaches SQL as
// `WHERE id = NaN`: MySQL answers with an error, the client gets a 500 and the SQL lands in the logs.
// Only a whole number from 1 to INT_MAX (the id columns are INT) passes; anything else answers 400 before any query runs.
// Returns the rule and validateRequest together, so a route adds one item. Put it after authorizeRoles (401/403 come
// first) and before requireCourseOwner / upload (no ownership query with a bad id, no file saved for a refused request).
export const validId = (name) => [
  param(name).isInt({ min: 1, max: INT_MAX }).withMessage(`${name} must be a positive whole number`),
  validateRequest,
];
