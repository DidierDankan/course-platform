// server/middleware/protectVideos.js
// Runs in front of express.static('/uploads'). Images (thumbnails, profile photos) stay
// public; a course video is only served to its owner, an admin, an enrolled student,
// or anyone when the lesson is marked as a preview.
import path from "path";
import { verifyAccessToken } from "../helpers/tokens.js";
import CourseService from "../db/CourseService.js";
import EnrollmentService from "../db/EnrollmentService.js";

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v", ".mkv", ".ogv"]);

const currentUser = (req) => {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return verifyAccessToken(token);

  } catch {
    return null; // expired or invalid token = not logged in
  }
};

export const protectVideos = async (req, res, next) => {
  let fileName;
  try {
    fileName = path.basename(decodeURIComponent(req.path));
  } catch {
    return res.status(400).end();
  }

  try {
    const media = await CourseService.fetchMediaAccessByUrl(`/uploads/${fileName}`);
    const looksLikeVideo = VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());

    if (!media || media.type !== "video") {
      // Not a known course video. A video file with no course behind it is never served.
      return looksLikeVideo ? res.status(404).end() : next();
    }

    if (Number(media.is_preview) === 1) return next();

    const user = currentUser(req);
    if (!user) return res.status(401).json({ message: "Log in to watch this lesson" });

    const isOwner = Number(media.seller_id) === Number(user.id);
    const isAdmin = user.role === "admin";
    const enrolled = isOwner || isAdmin
      ? true
      : !!(await EnrollmentService.getEnrollment(user.id, media.course_id));

    if (!enrolled) return res.status(403).json({ message: "Not enrolled" });

    // Don't let browsers or proxies keep a shared copy of a paid video.
    res.set("Cache-Control", "private, no-store");
    return next();
  } catch (err) {
    console.error("protectVideos error:", err);
    return res.status(500).end();
  }
};
