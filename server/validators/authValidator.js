// server/validators/authValidator.js
import { body } from 'express-validator';

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include at least one number and one special character'),
  body('role')
    .isIn(['seller', 'user'])
    .withMessage('Role must be one of: admin, seller, user'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
