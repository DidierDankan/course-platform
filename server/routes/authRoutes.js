import express from 'express';
import AuthController from '../controllers/AuthController.js';
import validateRequest from '../middleware/validateRequest.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { anonymousIsNobody, authenticate } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', registerLimiter, registerValidation, validateRequest, AuthController.register);
router.post('/login', loginLimiter, loginValidation, validateRequest, AuthController.login);
router.post('/logout', AuthController.logout);

// Session: refresh rotates the stored token, so it is POST (a GET with side effects is reachable cross-site).
router.post('/refresh', AuthController.refresh);
router.get('/me', anonymousIsNobody, authenticate, AuthController.me);

export default router;
