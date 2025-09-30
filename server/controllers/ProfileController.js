// server/controllers/UserController.js
import UserService from "../db/UserService.js";
import path from "path";
import { deleteFileIfExists } from "../utils/fileUtils.js";

class UserController {
  async getProfile(req, res) {
    try {
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
      let parsedSkills = [];
      let parsedQualifi = [];

      if (typeof skills === "string") parsedSkills = JSON.parse(skills);
      if (typeof qualifications === "string") parsedQualifi = JSON.parse(qualifications);

      const updates = {
        ...(full_name && { full_name }),
        ...(bio && { bio }),
        ...(phone && { phone }),
        ...(website && { website }),
      };

      // ✅ Handle profile image replacement
      if (profileImageFile) {
        await UserService.deleteProfileImage(userId);
        updates.profile_image = profileImageFile.filename;
      }

      // ✅ Update user profile data
      await UserService.updateUserProfile(userId, updates);

      // ✅ Update skills
      if (Array.isArray(parsedSkills)) {
        await UserService.insertUserSkills(userId, parsedSkills);
      }

      // ✅ Update qualifications
      if (Array.isArray(parsedQualifi)) {
        await UserService.insertUserQualifications(userId, parsedQualifi);
      }

      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
}

export default new UserController();
