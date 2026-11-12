import { param } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";
import { idRule } from "./fields.js";

// Route ids (:id, :mediaId, :courseId) arrive as text. Without a check, "abc" becomes NaN in the handler and reaches
// SQL as `WHERE id = NaN`: MySQL answers with an error, the client gets a 500 and the SQL lands in the logs.
// Only a whole number from 1 to INT_MAX (the id columns are INT) passes; anything else answers 400 before any query runs.

// The rule alone, for validators that check more than the id (they end with their own validateRequest).
export const idParam = (name) => idRule(param(name), name);

// The rule and validateRequest together, so a route adds one item. Put it after authorizeRoles (401/403 come
// first) and before requireCourseOwner / upload (no ownership query with a bad id, no file saved for a refused request).
export const validId = (name) => [idParam(name), validateRequest];
