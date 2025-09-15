// server/routes/authRoutes.js
import express from 'express';
import AuthController from '../controllers/AuthController.js';
import validateRequest from '../middleware/validateRequest.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';

const router = express.Router();

// Public auth routes
router.post('/register', registerValidation, validateRequest, AuthController.register);
router.post('/login', loginValidation, validateRequest, AuthController.login);
router.post('/logout', AuthController.logout);

export default router;
