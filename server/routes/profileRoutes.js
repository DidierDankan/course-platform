import express from 'express';
import ProfileController from '../controllers/ProfileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { profileValidation } from '../validators/profileValidator.js';


const router = express.Router();

router.get('/', authenticate, ProfileController.getProfile);
router.patch('/edit', authenticate, upload.single('profile_image'), profileValidation, validateRequest, ProfileController.updateProfile);

export default router;