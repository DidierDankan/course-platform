import { INT_MAX } from "./limits.js";

// Shared number rules for express-validator chains (body, query or param).
// Each one refuses an array first: isInt and isFloat check every item of an array, so ?sellerId=1&sellerId=2 or
// {"course_id": [1, 2]} would pass and then reach SQL as "1, 2" or NaN. Objects already fail isInt / isFloat.

// An id: a whole number from 1 to INT_MAX (the id columns are INT).
export const idRule = (chain, label) =>
  chain
    .not()
    .isArray()
    .withMessage(`${label} must be a single value`)
    .bail()
    .isInt({ min: 1, max: INT_MAX })
    .withMessage(`${label} must be a positive whole number`);

// A number of seconds an INT column can hold. Decimals are fine (browsers report 12.345 s; MySQL rounds them).
export const secondsRule = (chain, label) =>
  chain
    .not()
    .isArray()
    .withMessage(`${label} must be a single value`)
    .bail()
    .isFloat({ min: 0, max: INT_MAX })
    .withMessage(`${label} must be a number of seconds, 0 or more`);
