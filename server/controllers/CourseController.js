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
      const { title, description, price } = req.body;

      // 1️⃣ Update course data
      await CourseService.updateCourseById(id, { title, description, price });

      // 2️⃣ Replace thumbnail (if a new one is uploaded)
      if (req.files?.thumbnail?.length) {
        // Optionally: delete previous thumbnail before inserting
        await CourseService.deleteCourseThumbnail(id);
        await CourseService.insertCourseMedia(id, req.files.thumbnail[0]);
      }

      // 3️⃣ Append new videos (if any)
      if (req.files?.videos?.length) {
        const metaArray = Array.isArray(req.body["meta[]"])
          ? req.body["meta[]"]
          : [req.body["meta[]"]];

        await Promise.all(
          req.files.videos.map((file, idx) => {
            const meta = metaArray[idx] ? JSON.parse(metaArray[idx]) : {};
            return CourseService.insertCourseMedia(id, file, meta);
          })
        );
      }

      // 4️⃣ Get updated course (with fresh media)
      const updatedCourse = await CourseService.fetchCourseById(id);

      res.json({
        message: "Course updated successfully",
        course: updatedCourse,
      });
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

      // 1️⃣ Fetch all media for this course
      const [mediaRows] = await db.query(
        "SELECT url FROM course_media WHERE course_id = ?",
        [id]
      );

      // 2️⃣ Delete physical files from /uploads
      await Promise.all(
        mediaRows.map(async (m) => {
          const filePath = path.join(process.cwd(), m.url.replace(/^\//, "")); 
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`⚠️ Could not delete file ${filePath}:`, err.message);
          }
        })
      );

      // 3️⃣ Delete DB records
      await db.query("DELETE FROM course_media WHERE course_id = ?", [id]);
      await db.query("DELETE FROM courses WHERE id = ?", [id]);

      res.json({ message: "✅ Course and all media deleted successfully" });
    } catch (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Failed to delete course" });
    }
  }
}

export default new CourseController();
