// server/validators/authValidator.js
import { body } from 'express-validator';
import { LIMITS } from './limits.js';

// bcrypt only reads the first 72 bytes of a password: two longer passwords that share those bytes would both work.
// Refusing longer ones at registration means what the user typed is exactly what protects the account.
// Bytes, not characters: an emoji is 4 bytes in UTF-8.
const BCRYPT_MAX_BYTES = 72;

// isEmail and isLength check every item of an array, so ["a@x.co", "b@x.co"] would pass and reach SQL as "a, b".
// isString first refuses arrays and objects.
const email = () =>
  body('email')
    .isString()
    .withMessage('Invalid email format')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .bail()
    .isLength({ max: LIMITS.email })
    .withMessage(`Email can be at most ${LIMITS.email} characters`);

export const registerValidation = [
  email(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_BYTES)
    .withMessage(`Password can be at most ${BCRYPT_MAX_BYTES} bytes long`)
    .matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include at least one number and one special character'),
  body('role')
    .isString()
    .withMessage('Role must be one of: seller, user')
    .bail()
    .isIn(['seller', 'user'])
    .withMessage('Role must be one of: seller, user'),
];

// Login only checks the shape: an account created before the 72-byte rule can still sign in.
export const loginValidation = [
  email(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    .notEmpty()
    .withMessage('Password is required'),
];
