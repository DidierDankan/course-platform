// server/routes/authRoutes.js
import express from 'express';
import authController from '../controllers/authController';
import validateRequest from '../middleware/validateRequest';
import { registerValidation, loginValidation } from '../validators/authValidator';

const router = express.Router();

// Public auth routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/logout', authController.logout);

export default router;
