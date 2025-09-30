import db from "./connection.js";

class CourseService {

    async fetchCoursesWithThumbnails(sellerId = null) {
      const [rows] = await db.query(
        `
        SELECT c.id, c.title, c.description, c.price, c.seller_id, c.created_at,
               m.url AS thumbnail_url
        FROM courses c
        LEFT JOIN course_media m 
          ON m.course_id = c.id 
         AND m.type LIKE 'image%' 
        ${sellerId ? "WHERE c.seller_id = ?" : ""}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        `,
        sellerId ? [sellerId] : []
      );
    
      return rows;
    }
    
    /**
     * Insert a new course and return the new courseId
     */
    async insertCourse({ title, description, price, sellerId }) {
      const [result] = await db.query(
        "INSERT INTO courses (title, description, price, seller_id) VALUES (?, ?, ?, ?)",
        [title, description, price, sellerId]
      );
      return result.insertId;
    }

    /**
     * update an existing course by id
     */
    async updateCourseById(id, { title, description, price }) {
      await db.query(
        "UPDATE courses SET title = ?, description = ?, price = ? WHERE id = ?",
        [title, description, price, id]
      );
    }
    
    /**
     * Insert a media file for a course
     */
    async insertCourseMedia(courseId, file, meta = {}) {
      const { title = null, description = null, duration = null } = meta;

      // ✅ Normalize type based on mimetype
      let type = null;
      if (file.mimetype.startsWith("image/")) type = "image";
      else if (file.mimetype.startsWith("video/")) type = "video";
      else if (file.mimetype === "application/pdf") type = "pdf";

      await db.query(
        `INSERT INTO course_media (course_id, type, url, uploaded_at, title, description, duration)
        VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
        [
          courseId,
          type, // ✅ now "image" or "video", matches ENUM
          `/uploads/${file.filename}`,
          title,
          description,
          duration,
        ]
      );
    }

    async fetchCourseById(courseId) {
      // 1️⃣ Get main course info
      const [[course]] = await db.query(
        `SELECT id, title, description, price, seller_id, created_at
        FROM courses
        WHERE id = ?`,
        [courseId]
      );

      if (!course) return null;

      // 2️⃣ Get media for this course
      const [media] = await db.query(
        `SELECT id, type, url, title, description, duration, uploaded_at
        FROM course_media
        WHERE course_id = ?
        ORDER BY uploaded_at ASC`,
        [courseId]
      );

      return {
        ...course,
        media, // includes both thumbnail(s) and videos
      };
    }
    
    /**
     * Fetch all media for a given course
     */
    async fetchCourseMedia(courseId) {
      const [media] = await db.query(
        "SELECT * FROM course_media WHERE course_id = ? ORDER BY uploaded_at ASC",
        [courseId]
      );
      return media;
    }
    
    /**
     * Fetch single media URL (useful before deleting file from disk)
     */
    async fetchMediaById(mediaId) {
      const [[media]] = await db.query(
        "SELECT url FROM course_media WHERE id = ?",
        [mediaId]
      );
      return media;
    }
    
    /**
     * Delete a media entry by ID
     */
    async deleteMediaById(mediaId) {
      await db.query("DELETE FROM course_media WHERE id = ?", [mediaId]);
    }

    /**
     * Delete course Thumbnail on updateCourse
     */
    async deleteCourseThumbnail(courseId) {
      // 1️⃣ Get current thumbnail (first image for this course)
      const [rows] = await db.query(
        "SELECT id, url FROM course_media WHERE course_id = ? AND type = 'image' LIMIT 1",
        [courseId]
      );

      if (!rows.length) return;

      const { id, url } = rows[0];

      // 2️⃣ Remove file from disk
      try {
        const filePath = path.join(process.cwd(), url.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑 Deleted old thumbnail: ${filePath}`);
        }
      } catch (err) {
        console.error("Failed to delete old thumbnail from disk:", err);
      }

      // 3️⃣ Delete DB record
      await db.query("DELETE FROM course_media WHERE id = ?", [id]);
    }
}

export default new CourseService();
