// server/controllers/EnrollmentController.js
import EnrollmentService from "../db/EnrollmentService.js";

class EnrollmentController {
  constructor() {
    // Bind methods so they work when passed directly to routes
    this.enroll = this.enroll.bind(this);
    this.listUserEnrollments = this.listUserEnrollments.bind(this);
    this.checkEnrollment = this.checkEnrollment.bind(this);
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
      // If already enrolled, treat as 409 conflict (optional but better)
      const msg = err?.message || "Server error";
      const status = msg.includes("already enrolled") ? 409 : 500;

      console.error("Enrollment error:", err);
      return res.status(status).json({ ok: false, message: msg });
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

  async checkEnrollment(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);

      const enrollment = await EnrollmentService.getEnrollment(userId, courseId);

      if (!enrollment) {
        return res.status(404).json({ ok: true, enrolled: false });
      }

      return res.json({ ok: true, enrolled: true, enrollment });
    } catch (err) {
      console.error("Check enrollment error:", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }

  async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);

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