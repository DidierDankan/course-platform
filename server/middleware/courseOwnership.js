// server/middleware/courseOwnership.js
// authorizeRoles("seller") only proves the user IS a seller. These checks prove the
// course (or video) belongs to THEM. Admins can manage everything.
import CourseService from "../db/CourseService.js";

const canManage = (user, sellerId) =>
  user?.role === "admin" || Number(user?.id) === Number(sellerId);

// Course id comes from req.params.id. Place before the upload middleware so a
// refused request never writes files to disk.
export const requireCourseOwner = async (req, res, next) => {
  try {
    const sellerId = await CourseService.fetchCourseSellerId(Number(req.params.id));
    if (sellerId === null) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!canManage(req.user, sellerId)) {
      return res.status(403).json({ message: "You can only manage your own courses" });
    }
    return next();
  } catch (err) {
    console.error("requireCourseOwner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Media id comes from req.params.mediaId.
export const requireMediaOwner = async (req, res, next) => {
  try {
    const owner = await CourseService.fetchMediaOwner(Number(req.params.mediaId));
    if (!owner) {
      return res.status(404).json({ message: "Media not found" });
    }
    if (!canManage(req.user, owner.seller_id)) {
      return res.status(403).json({ message: "You can only manage your own courses" });
    }
    return next();
  } catch (err) {
    console.error("requireMediaOwner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
