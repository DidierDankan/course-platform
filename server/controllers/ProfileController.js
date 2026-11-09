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
      let parsedSkills;
      let parsedQualifi;

      try {
        if (typeof skills === "string") parsedSkills = JSON.parse(skills);
        if (typeof qualifications === "string") parsedQualifi = JSON.parse(qualifications);
      } catch {
        if (profileImageFile) await deleteFileIfExists(profileImageFile.path);
        return res.status(400).json({ message: "Invalid skills or qualifications" });
      }

      const updates = {
        ...(full_name && { full_name }),
        ...(bio && { bio }),
        ...(phone && { phone }),
        ...(website !== undefined && { website }), // may be "": the user can remove their website
      };

      // ✅ Handle profile image replacement
      if (profileImageFile) {
        await UserService.deleteProfileImage(userId);
        updates.profile_image = profileImageFile.filename;
      }

      // ✅ Update user profile data
      await UserService.updateUserProfile(userId, updates);

      // Only lists that were actually sent are replaced, so a partial request can't wipe the others.
      if (Array.isArray(parsedSkills)) {
        await UserService.replaceUserSkills(userId, parsedSkills);
      }

      if (Array.isArray(parsedQualifi)) {
        await UserService.replaceUserQualifications(userId, parsedQualifi);
      }

      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
}

export default new UserController();
