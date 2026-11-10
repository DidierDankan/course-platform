import express from 'express';
import AuthController from '../controllers/AuthController.js';
import validateRequest from '../middleware/validateRequest.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js'; // ✅ Import authenticate
import { loginLimiter, registerLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', registerLimiter, registerValidation, validateRequest, AuthController.register);
router.post('/login', loginLimiter, loginValidation, validateRequest, AuthController.login);
router.post('/logout', AuthController.logout);

// Protected route
router.get('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.me);

export default router;
