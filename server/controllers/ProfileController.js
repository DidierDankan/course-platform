// server/controllers/UserController.js
import UserService from "../db/UserService.js";
import { logError } from "../lib/logError.js";

class UserController {
  async getProfile(req, res) {
    try {
      const profile = await UserService.getUserProfile(req.user.id);
      if (!profile) return res.status(404).json({ message: 'User not found' });

      res.json(profile);
    } catch (err) {
      logError("Profile fetch", err);
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
      if (Array.isArray(skills)) {
        await UserService.replaceUserSkills(userId, skills);
      }

      if (Array.isArray(qualifications)) {
        await UserService.replaceUserQualifications(userId, qualifications);
      }


      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      logError("Update profile", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
}

export default new UserController();
