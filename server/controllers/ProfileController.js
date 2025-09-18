// server/controllers/UserController.js
import UserService from "../db/UserService.js";

class UserController {
  async getProfile(req, res) {
    try {
      console.log('🔎 Incoming /profile request');
      console.log('req.user:', req.user); // <--- THIS WILL SHOW YOU WHAT YOU GET
      const profile = await UserService.getUserProfile(req.user.id);
      if (!profile) return res.status(404).json({ message: 'User not found' });

      res.json(profile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const {
        full_name,
        bio,
        phone,
        website,
        skills,
        qualifications,
      } = req.body;

      const profileImageFile = req.file;
      if (typeof skills === 'string') skills = JSON.parse(skills);
      if (typeof qualifications === 'string') qualifications = JSON.parse(qualifications);

      const updates = {
        ...(full_name && { full_name }),
        ...(bio && { bio }),
        ...(phone && { phone }),
        ...(website && { website }),
        ...(profileImageFile && { profile_image: profileImageFile.filename }),
      };

      // Update user_profiles
      await UserService.updateUserProfile(userId, updates);

      // Update skills
      if (Array.isArray(skills)) {
        await UserService.insertUserSkills(userId, skills);
      }

      // Update qualifications
      if (Array.isArray(qualifications)) {
        await UserService.insertUserQualifications(userId, qualifications);
      }

      res.json({ message: 'Profile updated successfully' });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
}

export default new UserController();
