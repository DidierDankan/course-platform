import CourseService from "../db/CourseService.js";
import EnrollmentService from "../db/EnrollmentService.js";
import { parsePagination } from "../lib/pagination.js";
import { nonNegativeOrUndefined } from "../lib/queryNumbers.js";
import { logError } from "../lib/logError.js";

class CourseController {

  constructor() {
    this.watch = this.watch.bind(this);
  }

  // server/controllers/CourseController.js
  async getAllCourses(req, res) {
    try {
      const { limit, offset } = parsePagination(req.query);

      // Filters that only narrow the list are ignored when they aren't a number >= 0, so a stale or hand-edited
      // shared link still shows a list. sellerId is an id, so courseListValidation already refused a bad one with 400.
      const filters = {
        q: req.query.q || "",
        minPrice: nonNegativeOrUndefined(req.query.minPrice),
        maxPrice: nonNegativeOrUndefined(req.query.maxPrice),
        free: req.query.free,
        minDuration: nonNegativeOrUndefined(req.query.minDuration),
        maxDuration: nonNegativeOrUndefined(req.query.maxDuration),
        tutor: req.query.tutor,
        sellerId: req.query.sellerId === undefined ? undefined : Number(req.query.sellerId),
        sort: req.query.sort || "newest",
      };

      const result = await CourseService.fetchAllCourses(limit, offset, filters);
      res.json(result);
    } catch (err) {
      logError("List public courses", err);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  }

  async getCourses(req, res) {
    try {
      // This list includes every video URL, so sellers only get their own courses.
      // Only admins may ask for another seller (or, with no seller_id, everyone).
      const sellerId = req.user.role === "admin" ? req.query.seller_id : req.user.id;
      const courses = await CourseService.fetchCoursesWithThumbnails(sellerId);
      res.json(courses);
    } catch (err) {
      logError("List own courses", err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async addCourse(req, res) {
    try {
      const sellerId = req.user.id;
      const { title, description, price } = req.body;

      // 1️⃣ Insert course
      const courseId = await CourseService.insertCourse({
        title,
        description,
        price,
        sellerId,
      });


      // 2️⃣ Insert Thumbnail (if provided)
      if (req.files?.thumbnail?.length) {
        await CourseService.insertCourseMedia(courseId, req.files.thumbnail[0]);
      }

      // 3️⃣ Insert Videos. courseValidation already parsed and checked the lessons (req.body.meta), in upload order.
      if (req.files?.videos?.length) {
        await CourseService.insertCourseVideos(courseId, req.files.videos, req.body.meta ?? []);
      }

      // 4️⃣ Fetch the full course (optional but useful for client)
      const newCourse = await CourseService.fetchCourseById(courseId);

      res.status(201).json({
        message: "Course created successfully",
        course: newCourse,
      });
    } catch (err) {
      logError("Add course", err);
      res.status(500).json({ message: "Failed to create course" });
    }
  }

  async updateCourse(req, res) {
    try {
      const { id } = req.params;

      // courseValidation already parsed and checked the three lists. multer stores the client's "meta[]",
      // "existingVideos[]" and "deletedVideos[]" fields under the names without brackets.
      const metas = req.body.meta ?? [];
      const existingVideos = req.body.existingVideos ?? [];
      const deleteIds = (req.body.deletedVideos ?? []).map(Number);

      const { title, description, price } = req.body;
      await CourseService.updateCourseById(id, { title, description, price });

      const newThumbnail = req.files?.thumbnail?.[0];
      if (newThumbnail) {
        await CourseService.replaceCourseThumbnail(id, newThumbnail);
      }

      // Handle new video inserts
      const files = req.files?.videos || [];
      if (files.length) {
        await CourseService.insertCourseVideos(id, files, metas);
      }

      // Edits and deletions are scoped to this course in the service (WHERE id = ? AND course_id = ?),
      // so an id from another seller's course changes nothing.
      await Promise.all(
        existingVideos.map((v) =>
          CourseService.updateVideoMeta(v.id, id, {
            title: v.title,
            description: v.description,
            duration: v.duration,
          })
        )
      );

      await Promise.all(deleteIds.map((vid) => CourseService.deleteMediaByIdWithFile(vid, id)));

      const updatedCourse = await CourseService.fetchCourseById(id);
      res.json({ message: "Course updated successfully", course: updatedCourse });
    } catch (err) {
      logError("Update course", err);
      res.status(500).json({ message: "Failed to update course" });
    }
  }

  async getPublicCourse(req, res) {
    try {
      const courseId = Number(req.params.id);
      const data = await CourseService.fetchCoursePublic(courseId);
      if (!data) return res.status(404).json({ ok: false, message: "Course not found" });
      return res.json({ ok: true, course: data });
    } catch (err) {
      logError("Public course", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async getCourseMedia(req, res) {
    try {
      const media = await CourseService.fetchCourseMedia(req.params.id);
      res.json(media);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  }

  async deleteMedia(req, res) {
    try {
      const media = await CourseService.fetchMediaById(req.params.mediaId);
      if (!media) return res.status(404).json({ message: "Media not found" });

      // Optionally unlink from disk using fs.unlinkSync(media.url)

      await CourseService.deleteMediaById(req.params.mediaId);
      res.json({ message: "Media deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  }

  async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      // delete media first
      await CourseService.deleteAllCourseMedia(id);

      // then delete the course itself
      await CourseService.deleteCourseById(id);

      res.json({ message: "Course and media deleted successfully" });
    } catch (err) {
      logError("Delete course", err);
      res.status(500).json({ message: "Failed to delete course" });
    }
  }

  async watch(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.id);

      const watchData = await CourseService.fetchCourseWatchData(courseId);
      if (!watchData) {
        return res.status(404).json({ ok: false, message: "Course not found" });
      }

      const isOwner = Number(watchData.course.seller_id) === Number(userId);
      const isAdmin = req.user.role === "admin";
      const enrollment = await EnrollmentService.getEnrollment(userId, courseId);

      if (!enrollment && !isOwner && !isAdmin) {
        return res.status(403).json({ ok: false, message: "Not enrolled" });
      }

      return res.json({ ok: true, ...watchData, enrollment: enrollment || null });
    } catch (err) {
      logError("Watch course", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  
}

export default new CourseController();
