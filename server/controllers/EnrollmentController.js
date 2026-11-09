// server/controllers/EnrollmentController.js
import EnrollmentService from "../db/EnrollmentService.js";

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
      const { course_id } = req.body;

      if (!course_id) {
        return res.status(400).json({ ok: false, message: "Course ID is required." });
      }

      await EnrollmentService.createEnrollment({ userId, courseId: course_id });
      return res.status(201).json({ ok: true, message: "Enrollment successful!" });
    } catch (err) {
      // Expected refusals carry a status (404, 400, 403, 409); anything else is a server error.
      if (err?.status) {
        return res.status(err.status).json({ ok: false, message: err.message });
      }

      console.error("Enrollment error:", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async listUserEnrollments(req, res) {
    try {
      const userId = req.user.id;
      const enrollments = await EnrollmentService.getEnrollmentsByUser(userId);
      return res.json({ ok: true, enrollments });
    } catch (err) {
      console.error("List enrollments error:", err);
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

      console.log("PATCH progress payload:", req.body);

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
      console.error("Update progress error:", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new EnrollmentController();