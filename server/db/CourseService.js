import db from "./connection.js";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

class CourseService {

  // server/db/CourseService.js
  async fetchAllCourses(limit, offset, filters = {}) {
    const {
      q,
      minPrice,
      maxPrice,
      free,
      subscriptionOnly,
      minDuration,
      maxDuration,
      tutor,      // name search
      sellerId,   // exact
      sort = "newest",
    } = filters;

    const where = [];
    const params = [];

    // Search title/description
    if (q) {
      where.push(`(c.title LIKE ? OR c.description LIKE ? OR up.full_name LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // Price filters
    if (free === "1" || free === 1 || free === true) {
      where.push(`c.price = 0`);
    } else {
      if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
        where.push(`c.price >= ?`);
        params.push(Number(minPrice));
      }
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
        where.push(`c.price <= ?`);
        params.push(Number(maxPrice));
      }
    }

    // Subscription only
    if (subscriptionOnly === "1" || subscriptionOnly === 1 || subscriptionOnly === true) {
      where.push(`c.is_subscription_only = 1`);
    }

    // Tutor
    if (sellerId) {
      where.push(`c.seller_id = ?`);
      params.push(Number(sellerId));
    } else if (tutor) {
      where.push(`up.full_name LIKE ?`);
      params.push(`%${tutor}%`);
    }

    // Duration filters (seconds) using your aggregated SUM(video.duration)
    // NOTE: your DB currently uses `course_media.duration` (int) in some places.
    // This query uses m.duration (same as your existing fetchAllCourses).
    const durationHaving = [];
    const havingParams = [];
    if (minDuration !== undefined && minDuration !== null && minDuration !== "") {
      durationHaving.push(`SUM(CASE WHEN m.type = 'video' THEN m.duration END) >= ?`);
      havingParams.push(Number(minDuration));
    }
    if (maxDuration !== undefined && maxDuration !== null && maxDuration !== "") {
      durationHaving.push(`SUM(CASE WHEN m.type = 'video' THEN m.duration END) <= ?`);
      havingParams.push(Number(maxDuration));
    }

    // Sorting
    let orderBy = `c.created_at DESC`;
    if (sort === "price_asc") orderBy = `c.price ASC, c.created_at DESC`;
    if (sort === "price_desc") orderBy = `c.price DESC, c.created_at DESC`;
    if (sort === "duration_desc") orderBy = `total_duration DESC, c.created_at DESC`;

    const sql = `
      SELECT 
        c.id, c.title, c.description, c.price, c.created_at, c.seller_id,
        COALESCE(up.full_name, u.email) AS tutor_name,
        MAX(CASE WHEN m.type = 'image' THEN m.url END) AS thumbnail_url,
        COALESCE(SUM(CASE WHEN m.type = 'video' THEN m.duration END), 0) AS total_duration
      FROM courses c
      LEFT JOIN users u ON u.id = c.seller_id
      LEFT JOIN user_profiles up ON up.user_id = c.seller_id
      LEFT JOIN course_media m ON m.course_id = c.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY c.id
      ${durationHaving.length ? `HAVING ${durationHaving.join(" AND ")}` : ""}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, ...havingParams, Number(limit), Number(offset)];
    const [rows] = await db.query(sql, finalParams);
    return rows;
  }

  async fetchCoursesWithThumbnails(sellerId = null) {
    const [rows] = await db.query(
      `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.price, 
        c.seller_id, 
        c.created_at,
        -- ✅ get one thumbnail (latest or any)
        MAX(CASE WHEN m.type LIKE 'image' THEN m.url END) AS thumbnail_url,
        -- ✅ collect only videos into a JSON array
        CAST(
          JSON_ARRAYAGG(
            CASE 
              WHEN m.type LIKE 'video' 
              THEN JSON_OBJECT(
                'id', m.id,
                'url', m.url,
                'type', m.type,
                'duration', m.duration,
                'title', m.title,
                'description', m.description   
              )
            END
          ) AS CHAR
        ) AS videos
      FROM courses c
      LEFT JOIN course_media m ON m.course_id = c.id
      ${sellerId ? "WHERE c.seller_id = ?" : ""}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `,
      sellerId ? [sellerId] : []
    );

    return rows.map((row) => {
      let videos = [];
      try {
        videos = row.videos ? JSON.parse(row.videos) : [];
      } catch (err) {
        console.error("JSON parse error for videos:", err);
      }

      // ✅ remove nulls that JSON_ARRAYAGG can insert
      if (Array.isArray(videos)) {
        videos = videos.filter(Boolean);
      }

      return {
        ...row,
        videos,
      };
    });
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
    const fields = [];
    const vals = [];
    if (title !== undefined) { fields.push("title = ?"); vals.push(title); }
    if (description !== undefined) { fields.push("description = ?"); vals.push(description); }
    if (price !== undefined) { fields.push("price = ?"); vals.push(price); }
    if (!fields.length) return 0;
    vals.push(id);
    const [result] = await db.query(`UPDATE courses SET ${fields.join(", ")} WHERE id = ?`, vals);
    return result.affectedRows;
  }

  async updateVideoMeta(id, { title, description, duration }) {
    const fields = [];
    const vals = [];

    if (title !== undefined) { fields.push("title = ?"); vals.push(title); }
    if (description !== undefined) { fields.push("description = ?"); vals.push(description); }
    if (duration !== undefined) { fields.push("duration = ?"); vals.push(duration); }

    if (!fields.length) return 0;

    vals.push(id);
    const [result] = await db.query(
      `UPDATE course_media SET ${fields.join(", ")} WHERE id = ?`,
      vals
    );
    return result.affectedRows;
  }

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
  
  /**
   * Insert a media file for a course
   */
  // CourseService.js
  async insertCourseVideos(courseId, files, metaArray = []) {
    // Find current max order_index for this course's videos
    const [[r]] = await db.query(
      `SELECT COALESCE(MAX(order_index), -1) AS maxOrder
      FROM course_media
      WHERE course_id = ? AND type = 'video'`,
      [courseId]
    );

    let next = Number(r.maxOrder) + 1;

    // Insert sequentially (or build a bulk insert)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = metaArray[i] || {};
      const { title = null, description = null, duration = null } = meta;

      await db.query(
        `INSERT INTO course_media (course_id, type, url, uploaded_at, title, description, duration, order_index)
        VALUES (?, 'video', ?, NOW(), ?, ?, ?, ?)`,
        [
          courseId,
          `/uploads/${file.filename}`,
          title,
          description,
          duration,
          next,
        ]
      );

      next += 1;
    }
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


  async fetchCourseForWatching(courseId) {
    const [rows] = await db.query(
      `SELECT id, title, description, price, thumbnail_url, media_url
      FROM courses
      WHERE id = ?`,
      [courseId]
    );

    return rows[0];
  }

  async fetchCoursePublic(courseId) {
    const [[course]] = await db.query(
      `SELECT id, title, description, price, seller_id, is_subscription_only, created_at
      FROM courses
      WHERE id = ?`,
      [courseId]
    );
    if (!course) return null;

    const [media] = await db.query(
      `SELECT id, type, title, description, order_index, duration,
              CASE WHEN is_preview = 1 THEN url ELSE NULL END AS url,
              is_preview
      FROM course_media
      WHERE course_id = ? AND type = 'video'
      ORDER BY order_index ASC`,
      [courseId]
    );

    // thumbnail (optional)
    const [[thumb]] = await db.query(
      `SELECT url
      FROM course_media
      WHERE course_id = ? AND type = 'image'
      ORDER BY uploaded_at DESC
      LIMIT 1`,
      [courseId]
    );

    return {
      ...course,
      thumbnail_url: thumb?.url || null,
      lessons: media,
    };
  }

  async fetchCourseWatchData(courseId) {
    const [courseRows] = await db.query(
      `SELECT id, title, description, price
      FROM courses
      WHERE id = ?`,
      [courseId]
    );

    const course = courseRows[0];
    if (!course) return null;

    const [lessons] = await db.query(
      `SELECT id, url, title, description, duration, order_index
      FROM course_media
      WHERE course_id = ? AND type = 'video'
      ORDER BY order_index ASC, id ASC`,
      [courseId]
    );

    return { course, lessons };
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
    const [rows] = await db.query(
      "SELECT id, url FROM course_media WHERE course_id = ? AND type = 'image' LIMIT 1",
      [courseId]
    );

    if (!rows.length) return;

    const { id, url } = rows[0];

    try {
      const filePath = path.join(process.cwd(), url.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑 Deleted old thumbnail: ${filePath}`);
      }
    } catch (err) {
      console.error("Failed to delete old thumbnail from disk:", err);
    }

    await db.query("DELETE FROM course_media WHERE id = ?", [id]);
  }

  async deleteAllCourseMedia(courseId) {
    // 1️⃣ Get all media rows for this course
    const [mediaRows] = await db.query(
      "SELECT id, url FROM course_media WHERE course_id = ?",
      [courseId]
    );

    // 2️⃣ Delete physical files (if they exist on disk)
    for (const row of mediaRows) {
      if (row.url) {
        const filePath = path.join(UPLOADS_DIR, path.basename(row.url));
        fs.unlink(filePath, (err) => {
          if (err) {
            console.warn(`⚠️ Could not delete file ${filePath}:`, err.message);
          }
        });
      }
    }

    // 3️⃣ Delete DB rows
    await db.query("DELETE FROM course_media WHERE course_id = ?", [courseId]);

    return mediaRows.length;
  }

  async deleteCourseById(courseId) {
    await db.query("DELETE FROM courses WHERE id = ?", [courseId]);
  }

  async deleteMediaByIdWithFile(mediaId) {
    const [[row]] = await db.query(
      "SELECT url FROM course_media WHERE id = ?",
      [mediaId]
    );

    // delete file (best-effort)
    if (row?.url) {
      const filePath = path.join(process.cwd(), row.url.replace(/^\//, ""));
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }

    const [result] = await db.query(
      "DELETE FROM course_media WHERE id = ?",
      [mediaId]
    );
    return result.affectedRows; // 👈 important
  }

}

export default new CourseService();
