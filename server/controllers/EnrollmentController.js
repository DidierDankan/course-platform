// server/controllers/EnrollmentController.js
import EnrollmentService from "../db/EnrollmentService.js";
import { logError } from "../lib/logError.js";

class EnrollmentController {
  constructor() {
    // Bind methods so they work when passed directly to routes
    this.enroll = this.enroll.bind(this);
    this.listUserEnrollments = this.listUserEnrollments.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
  }

  async enroll(req, res) {
    try {
      const userId = req.user.id;
      // courseIdBody already checked course_id (a positive whole number).
      const courseId = Number(req.body.course_id);

      await EnrollmentService.createEnrollment({ userId, courseId });
      return res.status(201).json({ ok: true, message: "Enrollment successful!" });
    } catch (err) {
      // Expected refusals carry a status (404, 400, 403, 409); anything else is a server error.
      if (err?.status) {
        return res.status(err.status).json({ ok: false, message: err.message });
      }

      logError("Enroll", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async listUserEnrollments(req, res) {
    try {
      const userId = req.user.id;
      const enrollments = await EnrollmentService.getEnrollmentsByUser(userId);
      return res.json({ ok: true, enrollments });
    } catch (err) {
      logError("List enrollments", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);

      const enrollment = await EnrollmentService.getEnrollment(userId, courseId);
      if (!enrollment) {
        return res.status(403).json({ ok: false, message: "Not enrolled" });
      }

      const { progress, completed, lastWatchedMediaId, lastPositionSeconds } = req.body;

      await EnrollmentService.updateProgress({
        userId,
        courseId,
        progress,
        completed,
        lastWatchedMediaId,
        lastPositionSeconds,
      });

      return res.json({ ok: true, message: "Progress updated" });
    } catch (err) {
      // Expected refusals carry a status (404: the lesson isn't part of this course); anything else is a server error.
      if (err?.status) {
        return res.status(err.status).json({ ok: false, message: err.message });
      }
      logError("Update progress", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new EnrollmentController();