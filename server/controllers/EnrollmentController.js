import EnrollmentService from "../db/EnrollmentService.js";

const EnrollmentController = {
  async enroll(req, res) {
    try {
      const userId = req.user.id;
      const { course_id } = req.body;

      if (!course_id) {
        return res.status(400).json({ message: "Course ID is required." });
      }

      await EnrollmentService.createEnrollment({ userId, courseId: course_id });
      return res.status(201).json({ message: "Enrollment successful!" });
    } catch (err) {
      console.error("Enrollment error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  },

  async listUserEnrollments(req, res) {
    try {
      const userId = req.user.id;
      const enrollments = await EnrollmentService.getEnrollmentsByUser(userId);
      return res.json(enrollments);
    } catch (err) {
      console.error("List enrollments error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  async checkEnrollment(req, res) {
    try {
      const userId = req.user.id;
      const { courseId } = req.params;
      const enrollment = await EnrollmentService.getEnrollment(userId, courseId);
      if (!enrollment) {
        return res.status(404).json({ enrolled: false });
      }
      return res.json({ enrolled: true, enrollment });
    } catch (err) {
      console.error("Check enrollment error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { courseId } = req.params;
      const { progress, completed } = req.body;

      await EnrollmentService.updateProgress({ userId, courseId, progress, completed });
      return res.json({ message: "Progress updated" });
    } catch (err) {
      console.error("Update progress error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
};

export default EnrollmentController;
