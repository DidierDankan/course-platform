import { body, query } from "express-validator";
import { idRule, secondsRule } from "./fields.js";
import { LIMITS } from "./limits.js";

// Stripe refuses USD charges under $0.50 or over $999,999.99, so a price outside that range
// (other than free) would create a course nobody can buy.
const MIN_PAID_PRICE = 0.5;
const MAX_PRICE = 999999.99;

// The course form is multipart: each lesson arrives as one JSON text field (meta[] for new videos, existingVideos[] for
// edits of saved ones). multer makes an array of repeated fields and leaves a single one as text, so this always
// returns an array, every item parsed. Text that isn't JSON stays text and fails "must be an object" with a 400,
// instead of the lesson being saved silently without its title.
const toList = (value) => (Array.isArray(value) ? value : [value]);
const parseJsonList = (value) =>
  toList(value).map((item) => {
    if (typeof item !== "string") return item;
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  });

// Title, description and duration of one lesson. Empty is fine (the form sends "" and null); too long, not text,
// or a duration that isn't a number of seconds the INT column can hold is a 400. Decimals are fine: browsers report
// 12.345 seconds and MySQL rounds them.
const lessonFields = (list) => [
  body(`${list}.*`).isObject().withMessage("Each lesson must be an object"),
  body(`${list}.*.title`)
    .optional({ values: "null" })
    .isString()
    .withMessage("A lesson title must be text")
    .bail()
    .trim()
    .isLength({ max: LIMITS.lessonTitle })
    .withMessage(`A lesson title can be at most ${LIMITS.lessonTitle} characters`),
  body(`${list}.*.description`)
    .optional({ values: "null" })
    .isString()
    .withMessage("A lesson description must be text")
    .bail()
    .isLength({ max: LIMITS.lessonDescription })
    .withMessage(`A lesson description can be at most ${LIMITS.lessonDescription} characters`),
  secondsRule(body(`${list}.*.duration`).optional({ values: "null" }), "A lesson duration"),
];

export const courseValidation = [
  body("title")
    .isString()
    .withMessage("Title is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: LIMITS.courseTitle })
    .withMessage(`Title can be at most ${LIMITS.courseTitle} characters`),
  body("description")
    .isString()
    .withMessage("Description is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: LIMITS.courseDescription })
    .withMessage(`Description can be at most ${LIMITS.courseDescription} characters`),
  body("price")
    .not()
    .isArray()
    .withMessage("Price must be a number")
    .bail()
    .isFloat({ min: 0, max: MAX_PRICE })
    .withMessage(`Price must be a number from 0 to ${MAX_PRICE}`)
    .bail()
    .custom((value) => Number(value) === 0 || Number(value) >= MIN_PAID_PRICE)
    .withMessage(`A paid course must cost at least ${MIN_PAID_PRICE.toFixed(2)}`),

  // New lessons (one per uploaded video, same order)
  body("meta").optional().customSanitizer(parseJsonList),
  ...lessonFields("meta"),

  // Saved lessons being edited: same fields, plus the id of the lesson
  body("existingVideos").optional().customSanitizer(parseJsonList),
  ...lessonFields("existingVideos"),
  idRule(body("existingVideos.*.id"), "Each edited lesson's id"),

  // Saved lessons being deleted: ids only
  body("deletedVideos").optional().customSanitizer(toList),
  idRule(body("deletedVideos.*"), "Each deleted lesson's id"),
];

// GET /api/courses/all. Filters that only narrow the list (price, duration) are ignored by the controller when invalid;
// sellerId is an id, so a bad one is a 400 rather than silently showing every seller's courses.
export const courseListValidation = [idRule(query("sellerId").optional(), "sellerId")];
