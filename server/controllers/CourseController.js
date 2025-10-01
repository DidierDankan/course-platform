import CourseService from "../db/CourseService.js";

class CourseController {
  async getCourses(req, res) {
    try {
      const { seller_id } = req.query;
      const courses = await CourseService.fetchCoursesWithThumbnails(seller_id);
      res.json(courses);
    } catch (err) {
      console.error("Error fetching courses:", err);
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

      // 3️⃣ Insert Videos (with meta)
      if (req.files?.videos?.length) {
        // Use `req.body.meta` instead
        const rawMeta = req.body.meta || []; // could be string or array
        const metaArray = Array.isArray(rawMeta) ? rawMeta : [rawMeta];

        await Promise.all(
          req.files.videos.map((file, idx) => {
            const meta = metaArray[idx] ? JSON.parse(metaArray[idx]) : {};
            return CourseService.insertCourseMedia(courseId, file, meta);
          })
        );
      }

      // 4️⃣ Fetch the full course (optional but useful for client)
      const newCourse = await CourseService.fetchCourseById(courseId);

      res.status(201).json({
        message: "Course created successfully",
        course: newCourse,
      });
    } catch (err) {
      console.error("Error adding course:", err);
      res.status(500).json({ message: "Failed to create course" });
    }
  }

  async updateCourse(req, res) {
    try {
      const { id } = req.params;

      // 🔎 Debugging + parsing helpers
      const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

      // Handle both "existingVideos[]" and "existingVideos"
      const existingRaw = toArray(req.body["existingVideos[]"] || req.body.existingVideos);
      const deletesRaw  = toArray(req.body["deletedVideos[]"] || req.body.deletedVideos);
      const metaRaw     = toArray(req.body["meta[]"] || req.body.meta);

      let metas = [];
      let existingVideos = [];
      let deleteIds = [];

      try { metas = metaRaw.map((s) => JSON.parse(s)); } catch (e) { console.warn("⚠️ meta[] JSON parse failed:", e); }
      try { existingVideos = existingRaw.map((s) => JSON.parse(s)); } catch (e) { console.warn("⚠️ existingVideos[] JSON parse failed:", e); }
      try { deleteIds = deletesRaw.map((s) => Number(s)); } catch (e) { console.warn("⚠️ deletedVideos[] cast failed:", e); }

      // 🟢 Now continue with your real update logic
      const { title, description, price } = req.body;
      await CourseService.updateCourseById(id, { title, description, price });

      // Handle new video inserts
      const files = req.files?.videos || [];
      const insertResults = await Promise.all(
        files.map((file, idx) => {
          const meta = metas[idx] || {};
          return CourseService.insertCourseMedia(id, file, meta);
        })
      );

      // Handle updates
      const updateResults = await Promise.all(
        existingVideos.map((v) =>
          CourseService.updateVideoMeta(v.id, {
            title: v.title,
            description: v.description,
            duration: v.duration,
          })
        )
      );

      // Handle deletions
      const deleteResults = await Promise.all(
        deleteIds.map((vid) => CourseService.deleteMediaByIdWithFile(vid))
      );

      const updatedCourse = await CourseService.fetchCourseById(id);
      res.json({ message: "Course updated successfully", course: updatedCourse });
    } catch (err) {
      console.error("Error updating course:", err);
      res.status(500).json({ message: "Failed to update course" });
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
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Failed to delete course" });
    }
  }
}

export default new CourseController();
