import { body } from "express-validator";
import { LIMITS } from "./limits.js";

// The profile form is multipart, so the two lists arrive as JSON text. Parse them here, so the
// rules below and the controller see real arrays. Text that isn't JSON stays a string and fails isArray.
const parseJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// Optional text: missing or null is fine, anything else must be text that fits its column.
const optionalText = (field, label, max) =>
  body(field)
    .optional({ values: "null" })
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${label} can be at most ${max} characters`);

// Optional link: empty is fine (it removes the link), anything else must be an http(s) address.
const optionalWebAddress = (field, label, max) =>
  body(field)
    .optional({ values: "falsy" }) // "" or null: no link
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${label} can be at most ${max} characters`)
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage(`${label} must be a web address starting with http:// or https://`);


export const profileValidation = [
  optionalText("full_name", "Full name", LIMITS.fullName),
  optionalText("phone", "Phone", LIMITS.phone),
  optionalText("bio", "Bio", LIMITS.bio),
  optionalWebAddress("website", "Website", LIMITS.website),

  body("skills").optional().customSanitizer(parseJson).isArray().withMessage("Skills must be a list"),
  body("skills.*")
    .isString()
    .withMessage("Each skill must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("A skill can't be empty")
    .isLength({ max: LIMITS.skill })
    .withMessage(`A skill can be at most ${LIMITS.skill} characters`),

  body("qualifications")
    .optional()
    .customSanitizer(parseJson)
    .isArray()
    .withMessage("Qualifications must be a list"),
  body("qualifications.*").isObject().withMessage("Each qualification must be an object"),
  body("qualifications.*.title")
    .isString()
    .withMessage("Each qualification needs a title")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Each qualification needs a title")
    .isLength({ max: LIMITS.qualificationTitle })
    .withMessage(`A qualification title can be at most ${LIMITS.qualificationTitle} characters`),
  optionalText("qualifications.*.institution", "Institution", LIMITS.qualificationInstitution),
  optionalText("qualifications.*.description", "Qualification description", LIMITS.qualificationDescription),
  optionalWebAddress("qualifications.*.certificate_url", "Certificate URL", LIMITS.certificateUrl),
  body("qualifications.*.issued_at")
    .optional({ values: "falsy" }) // an empty date input sends "": no date
    .isDate({ format: "YYYY-MM-DD", strictMode: true, delimiters: ["-"] })
    .withMessage("Issue date must be a real date like 2024-01-31"),
];
