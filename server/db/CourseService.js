import db from "./connection.js";
import fs from "fs";
import path from "path";
import config from "../config.js";
import { logError } from "../lib/logError.js";
import { httpError } from "../lib/answerError.js";
import { deleteFileIfExists } from "../utils/fileUtils.js";
import { withTransaction } from "./transaction.js";
import { dampedRatingSql, ratingColumns, withRating } from "./ratings.js";

const UPLOADS_DIR = config.uploadDir;

// Whitelist: ?sort= value -> fixed ORDER BY. The request value never reaches the SQL.
// c.id DESC breaks ties so paging never repeats or skips a course.
// "popular" counts enrollments in a correlated subquery (indexed by the course_id FK);
// a LEFT JOIN would multiply the course_media rows and inflate total_duration.
const SORT_ORDER = Object.freeze({
  newest: "c.created_at DESC, c.id DESC",
  price_asc: "c.price ASC, c.created_at DESC, c.id DESC",
  price_desc: "c.price DESC, c.created_at DESC, c.id DESC",
  duration_desc: "total_duration DESC, c.created_at DESC, c.id DESC",
  popular:
    "(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) DESC, c.created_at DESC, c.id DESC",
  // damped average (db/ratings.js): one 5-star review can't outrank many 4.8s
  top_rated: `${dampedRatingSql("c")} DESC, c.created_at DESC, c.id DESC`,
});

// Best effort, and only ever AFTER the database change is committed: the row is what matters, and a file that's already
// gone is fine. Removing the file first would leave a lesson pointing at a missing video if the delete then failed.
const removeStoredFile = (url) => {
  if (!url) return;
  try {
    fs.unlinkSync(path.join(UPLOADS_DIR, path.basename(url)));
  } catch {
    /* nothing to remove */
  }
};

// multer saved this request's files before the controller ran; when the save rolls back, nothing points at them.
const removeUploads = (files) => Promise.all(files.filter(Boolean).map((file) => deleteFileIfExists(file.path)));

class CourseService {

  // server/db/CourseService.js
  async fetchAllCourses(limit, offset, filters = {}) {
    const {
      q,
      minPrice,
      maxPrice,
      free,
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
      if (minPrice !== undefined) {
        where.push(`c.price >= ?`);
        params.push(minPrice);
      }
      if (maxPrice !== undefined) {
        where.push(`c.price <= ?`);
        params.push(maxPrice);
      }
    }

    // Tutor. sellerId is already a checked whole number (courseListValidation) or undefined.
    if (sellerId !== undefined) {
      where.push(`c.seller_id = ?`);
      params.push(sellerId);
    } else if (tutor) {
      where.push(`up.full_name LIKE ?`);
      params.push(`%${tutor}%`);
    }

    // Duration filters (seconds) on the summed lesson durations. The controller passes a number >= 0 or undefined.
    const durationHaving = [];
    const havingParams = [];
    if (minDuration !== undefined) {
      durationHaving.push(`SUM(CASE WHEN m.type = 'video' THEN m.duration END) >= ?`);
      havingParams.push(minDuration);
    }
    if (maxDuration !== undefined) {
      durationHaving.push(`SUM(CASE WHEN m.type = 'video' THEN m.duration END) <= ?`);
      havingParams.push(maxDuration);
    }

    // Sorting: the request only picks a key; the SQL comes from this fixed map. Object.hasOwn, not SORT_ORDER[sort]:
    // "__proto__" or "constructor" would otherwise find Object's own properties and put "[object Object]" in the SQL.
    const orderBy = Object.hasOwn(SORT_ORDER, sort) ? SORT_ORDER[sort] : SORT_ORDER.newest;

    const sql = `
      SELECT 
        c.id, c.title, c.description, c.price, c.created_at, c.seller_id,
        up.full_name AS tutor_name, -- NULL without a profile name (the card shows "Instructor"); never the email, this list is public
        MAX(CASE WHEN m.type = 'image' THEN m.url END) AS thumbnail_url,
        COALESCE(SUM(CASE WHEN m.type = 'video' THEN m.duration END), 0) AS total_duration,
        ${ratingColumns("c")}
      FROM courses c
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
    return rows.map(withRating);
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
                'description', m.description,
                'is_preview', m.is_preview
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
        logError("Parse course videos JSON", err);
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
  
  // ---- Writes. Each step takes `q`: the pool by default, or the transaction's connection, so that a whole save runs as
  // one unit. The save methods further down decide which steps run together; controllers only call those. ----

  async insertCourse({ title, description, price, sellerId }, q = db) {
    const [result] = await q.query(
      "INSERT INTO courses (title, description, price, seller_id) VALUES (?, ?, ?, ?)",
      [title, description, price, sellerId]
    );
    return result.insertId;
  }

  async updateCourseById(id, { title, description, price }, q = db) {
    const fields = [];
    const vals = [];
    if (title !== undefined) { fields.push("title = ?"); vals.push(title); }
    if (description !== undefined) { fields.push("description = ?"); vals.push(description); }
    if (price !== undefined) { fields.push("price = ?"); vals.push(price); }
    if (!fields.length) return 0;
    vals.push(id);
    const [result] = await q.query(`UPDATE courses SET ${fields.join(", ")} WHERE id = ?`, vals);
    return result.affectedRows;
  }

  // Only touches the row if it belongs to courseId, so a video id from another course is ignored.
  // is_preview: true/false switches the free preview; undefined leaves it as it is.
  async updateVideoMeta(id, courseId, { title, description, duration, is_preview: isPreview }, q = db) {
    const fields = [];
    const vals = [];

    if (title !== undefined) { fields.push("title = ?"); vals.push(title); }
    if (description !== undefined) { fields.push("description = ?"); vals.push(description); }
    if (duration !== undefined) { fields.push("duration = ?"); vals.push(duration); }
    if (isPreview !== undefined) { fields.push("is_preview = ?"); vals.push(isPreview ? 1 : 0); }

    if (!fields.length) return 0;

    vals.push(id, courseId);
    const [result] = await q.query(
      `UPDATE course_media SET ${fields.join(", ")} WHERE id = ? AND course_id = ?`,
      vals
    );
    return result.affectedRows;
  }

  // Points the existing row at the new file in one statement, so the course always has exactly one
  // thumbnail (lists show MAX(url), so a leftover image could be the one displayed).
  // Returns the urls no longer used (the old image, any extras); the caller removes those files after commit.
  async replaceCourseThumbnail(courseId, file, q = db) {
    const [images] = await q.query(
      "SELECT id, url FROM course_media WHERE course_id = ? AND type = 'image' ORDER BY id FOR UPDATE",
      [courseId]
    );
    if (!images.length) {
      await this.insertCourseMedia(courseId, file, {}, q);
      return [];
    }

    const [current, ...extras] = images;
    await q.query("UPDATE course_media SET url = ?, uploaded_at = NOW() WHERE id = ?", [
      `/uploads/${file.filename}`,
      current.id,
    ]);
    const unused = [current.url];
    for (const { id } of extras) {
      const url = await this.deleteMediaRow(id, courseId, q);
      if (url) unused.push(url);
    }
    return unused;
  }

  async insertCourseMedia(courseId, file, meta = {}, q = db) {
    const { title = null, description = null, duration = null } = meta;

    // ✅ Normalize type based on mimetype
    let type = null;
    if (file.mimetype.startsWith("image/")) type = "image";
    else if (file.mimetype.startsWith("video/")) type = "video";
    else if (file.mimetype === "application/pdf") type = "pdf";

    await q.query(
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

  // New lessons go after the existing ones (order_index continues from the current maximum).
  async insertCourseVideos(courseId, files, metaArray = [], q = db) {
    const [[r]] = await q.query(
      `SELECT COALESCE(MAX(order_index), -1) AS maxOrder
      FROM course_media
      WHERE course_id = ? AND type = 'video'`,
      [courseId]
    );

    let next = Number(r.maxOrder) + 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = metaArray[i] || {};
      const { title = null, description = null, duration = null, is_preview: isPreview = false } = meta;

      // is_preview: the seller's "Free preview" checkbox; a preview lesson's file is open to anyone (protectVideos)
      await q.query(
        `INSERT INTO course_media (course_id, type, url, uploaded_at, title, description, duration, order_index, is_preview)
        VALUES (?, 'video', ?, NOW(), ?, ?, ?, ?, ?)`,
        [
          courseId,
          `/uploads/${file.filename}`,
          title,
          description,
          duration,
          next,
          isPreview ? 1 : 0,
        ]
      );

      next += 1;
    }
  }

  // Deletes one media row of courseId and returns its url (null if it isn't there or belongs to another course).
  // The FILE stays: the caller removes it once the transaction has committed.
  async deleteMediaRow(mediaId, courseId, q = db) {
    const [[row]] = await q.query(
      "SELECT url FROM course_media WHERE id = ? AND course_id = ? FOR UPDATE",
      [mediaId, courseId]
    );
    if (!row) return null;
    await q.query("DELETE FROM course_media WHERE id = ? AND course_id = ?", [mediaId, courseId]);
    return row.url;
  }

  async deleteCourseRow(courseId, q = db) {
    await q.query("DELETE FROM courses WHERE id = ?", [courseId]);
  }

  // ---- Saves: each one is all-or-nothing. A failure rolls the database back and removes this request's uploads;
  // files that are no longer used are removed only after the commit. ----

  // Returns the new course id.
  async createCourse({ sellerId, title, description, price, thumbnail, videos = [], lessons = [] }) {
    try {
      return await withTransaction(async (conn) => {
        const courseId = await this.insertCourse({ title, description, price, sellerId }, conn);
        if (thumbnail) await this.insertCourseMedia(courseId, thumbnail, {}, conn);
        if (videos.length) await this.insertCourseVideos(courseId, videos, lessons, conn);
        return courseId;
      });
    } catch (err) {
      await removeUploads([thumbnail, ...videos]);
      throw err;
    }
  }

  // lessonEdits: [{ id, title, description, duration }]; deletedLessonIds: [id]. Ids of another course are ignored.
  async updateCourse(
    courseId,
    { title, description, price, thumbnail, videos = [], lessons = [], lessonEdits = [], deletedLessonIds = [] }
  ) {
    let unusedUrls;
    try {
      unusedUrls = await withTransaction(async (conn) => {
        const unused = [];
        await this.updateCourseById(courseId, { title, description, price }, conn);
        if (thumbnail) unused.push(...(await this.replaceCourseThumbnail(courseId, thumbnail, conn)));
        if (videos.length) await this.insertCourseVideos(courseId, videos, lessons, conn);
        for (const edit of lessonEdits) await this.updateVideoMeta(edit.id, courseId, edit, conn);
        for (const id of deletedLessonIds) {
          const url = await this.deleteMediaRow(id, courseId, conn);
          if (url) unused.push(url);
        }
        return unused;
      });
    } catch (err) {
      await removeUploads([thumbnail, ...videos]);
      throw err;
    }
    unusedUrls.forEach(removeStoredFile);
  }

  // Deletes the course and its media rows (favorites go with it, ON DELETE CASCADE). A course with any enrollment, free
  // or paid, is refused with 409: the cascade would silently take away students' access and the payment records.
  // The course row is locked first, so an enrollment can't commit between the check and the delete: its foreign-key
  // check needs a shared lock on that row and waits, then fails because the course is gone.
  async deleteCourse(courseId) {
    const urls = await withTransaction(async (conn) => {
      await conn.query("SELECT id FROM courses WHERE id = ? FOR UPDATE", [courseId]);
      // A locking read sees the latest committed enrollment, not this transaction's snapshot.
      const [[enrolled]] = await conn.query("SELECT 1 FROM enrollments WHERE course_id = ? LIMIT 1 FOR SHARE", [courseId]);
      if (enrolled) {
        throw httpError(409, "Students are enrolled in this course, so it can't be deleted. Their access and purchases stay.");
      }
      const [rows] = await conn.query("SELECT url FROM course_media WHERE course_id = ? FOR UPDATE", [courseId]);
      await conn.query("DELETE FROM course_media WHERE course_id = ?", [courseId]);
      await this.deleteCourseRow(courseId, conn);
      return rows.map((row) => row.url);
    });
    urls.forEach(removeStoredFile);
  }

  // Deletes one lesson (or image) of courseId. Returns false if it wasn't there.
  async deleteLesson(mediaId, courseId) {
    const url = await withTransaction((conn) => this.deleteMediaRow(mediaId, courseId, conn));
    removeStoredFile(url);
    return url !== null;
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
      `SELECT id, type, url, title, description, duration, is_preview, uploaded_at
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

  async fetchCoursePublic(courseId) {
    const [[row]] = await db.query(
      `SELECT c.id, c.title, c.description, c.price, c.seller_id, c.is_subscription_only, c.created_at,
              ${ratingColumns("c")}
      FROM courses c
      WHERE c.id = ?`,
      [courseId]
    );
    if (!row) return null;
    const course = withRating(row);

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
      `SELECT id, title, description, price, seller_id
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
  
  /** Owner of a course, or null if the course doesn't exist. */
  async fetchCourseSellerId(courseId) {
    const [[row]] = await db.query("SELECT seller_id FROM courses WHERE id = ?", [courseId]);
    return row ? row.seller_id : null;
  }

  /** What protectVideos needs to decide who may load a file under /uploads. */
  async fetchMediaAccessByUrl(url) {
    const [[row]] = await db.query(
      `SELECT m.type, m.is_preview, m.course_id, c.seller_id
       FROM course_media m JOIN courses c ON c.id = m.course_id
       WHERE m.url = ?
       LIMIT 1`,
      [url]
    );
    return row;
  }

  /** Course and owner a media row belongs to, or undefined if it doesn't exist. */
  async fetchMediaOwner(mediaId) {
    const [[row]] = await db.query(
      `SELECT m.course_id, c.seller_id
       FROM course_media m JOIN courses c ON c.id = m.course_id
       WHERE m.id = ?`,
      [mediaId]
    );
    return row;
  }
}

export default new CourseService();
