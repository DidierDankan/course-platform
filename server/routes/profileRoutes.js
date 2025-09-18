import express from 'express';
import ProfileController from '../controllers/ProfileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', authenticate, ProfileController.getProfile);
router.patch('/edit', authenticate, upload.single('profile_image'), ProfileController.updateProfile);

export default router;