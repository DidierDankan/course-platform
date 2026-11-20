// server/middleware/protectVideos.js
// Runs in front of express.static('/uploads'). Images (thumbnails, profile photos) stay
// public; a course video is only served to its owner, an admin, an enrolled student,
// or anyone when the lesson is marked as a preview.
// "Served" depends on the storage (lib/storage.js): on disk, express.static sends the file; with Supabase, the answer
// is a redirect to the bucket: the public URL for an image, a link that expires for a video. A refused viewer never
// gets a link, because the checks below run first in both cases.
import path from "path";
import storage from "../lib/storage.js";
import { mediaKindOf, uploadUrl } from "../lib/mediaTypes.js";
import { verifyAccessToken } from "../helpers/tokens.js";
import CourseService from "../db/CourseService.js";
import EnrollmentService from "../db/EnrollmentService.js";
import { logError } from "../lib/logError.js";

// Paid video links: never kept by browsers or proxies. Images are public and their names never change, so a day is safe.
const PRIVATE_NO_STORE = "private, no-store";
const PUBLIC_IMAGE_CACHE = "public, max-age=86400";

// Hands the allowed request to the storage: express.static on disk, a redirect with Supabase (404 when the file
// isn't there or isn't a media type we store).
async function deliver(req, res, next, fileName) {
  if (storage.servesLocally) return next();
  const target = await storage.deliveryUrl(fileName);
  if (!target) return res.status(404).end();
  if (mediaKindOf(fileName) === "image") res.set("Cache-Control", PUBLIC_IMAGE_CACHE);
  return res.redirect(302, target);
}

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
    const media = await CourseService.fetchMediaAccessByUrl(uploadUrl(fileName));
    const looksLikeVideo = mediaKindOf(fileName) === "video";

    if (!media || media.type !== "video") {
      // Not a known course video. A video file with no course behind it is never served.
      return looksLikeVideo ? res.status(404).end() : deliver(req, res, next, fileName);
    }

    // Every video answer, preview or paid: a signed link is personal and short-lived, so nothing may keep it.
    res.set("Cache-Control", PRIVATE_NO_STORE);
    if (Number(media.is_preview) === 1) return deliver(req, res, next, fileName);

    const user = currentUser(req);
    if (!user) return res.status(401).json({ message: "Log in to watch this lesson" });

    const isOwner = Number(media.seller_id) === Number(user.id);
    const isAdmin = user.role === "admin";
    const enrolled = isOwner || isAdmin
      ? true
      : !!(await EnrollmentService.getEnrollment(user.id, media.course_id));

    if (!enrolled) return res.status(403).json({ message: "Not enrolled" });

    return deliver(req, res, next, fileName);
  } catch (err) {
    logError("protectVideos", err);
    return res.status(500).end();
  }
};
