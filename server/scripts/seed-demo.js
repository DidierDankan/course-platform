// server/scripts/seed-demo.js
// Demo data for the live site and screenshots: 1 demo instructor, 1 demo student, 4 courses with
// thumbnails (cut from the reference contact sheet) and 2 lessons each (the first is a free preview),
// plus one enrollment at 50% so "Continue learning" has something to show.
//
//   DEMO_PASSWORD=... npm run seed:demo      (NODE_ENV=production also needs --force)
//
// Videos: put royalty-free .mp4 files (< 50 MB each) in server/scripts/seed-assets/. They are not
// committed. With none there, the script stops before touching anything.
// Idempotent: re-running updates the same rows instead of adding copies.
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import db from "../db/connection.js";
import {
  ScriptStop,
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
  refuseProductionUnlessForced,
  removeUploadFile,
  runScript,
  DEMO_STUDENT_EMAIL
} from "./lib.js";

const SCRIPT = "seed-demo";
const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(SCRIPTS_DIR, "seed-assets");
const THUMBS_DIR = path.join(SCRIPTS_DIR, "seed-data", "thumbnails");
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 10; // same cost as UserService.createUser
const LESSONS_PER_COURSE = 2;
const STUDENT_PROGRESS = 50; // 1 of 2 lessons completed, matching how the server computes progress


// .test is a reserved TLD: these addresses can never belong to a real person.
const SELLER = {
  email: "demo-instructor@lumen.test",
  role: "seller",
  fullName: "Maya Chen",
  bio: "Photographer and ceramicist. I teach the slow, hands-on version of every craft.",
  qualification: { title: "BA Fine Arts", institution: "Lumen Demo Academy" },
};
const STUDENT = { email: DEMO_STUDENT_EMAIL, role: "user", fullName: "Sam Rivera" };

// Titles, copy and prices from the reference designs (design/*/src/App.tsx). Thumbnails are the
// cinematic contact-sheet tiles: one image per course, like a seller would upload.
const COURSES = [
  {
    title: "Form & fire: the art of hand-built ceramics",
    description: "Learn hand-building techniques and create beautiful, useful pieces without a wheel.",
    price: 89,
    thumbnail: "ceramics.jpg",
    lessons: ["Wedging and pinch pots", "Coil building a vessel"],
  },
  {
    title: "Cinema in stills: visual storytelling",
    description: "Find your visual voice and tell honest stories through everyday moments.",
    price: 74,
    thumbnail: "film.jpg",
    lessons: ["Seeing in frames", "Light, shadow and mood"],
  },
  {
    title: "Bold marks: abstract painting in motion",
    description: "Build a playful studio practice through colour, composition, and expressive mark-making.",
    price: 65,
    thumbnail: "painting.jpg",
    lessons: ["Colour before composition", "Gesture and the loaded brush"],
  },
  {
    title: "Slow bread: sourdough from scratch",
    description: "Master a dependable starter, intuitive dough handling, and the perfect golden crust.",
    price: 59,
    thumbnail: "bread.jpg",
    lessons: ["Building a starter", "Shaping and the first bake"],
  },
];
// The student is enrolled in this course (index into COURSES) and has favorited another.
const ENROLLED_COURSE = 1;
const FAVORITE_COURSE = 0;

async function findVideos() {
  let names;
  try {
    names = await fs.readdir(ASSETS_DIR);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    names = [];
  }
  const videos = names.filter((n) => n.toLowerCase().endsWith(".mp4")).sort();
  if (videos.length === 0) {
    throw new ScriptStop(
      `${SCRIPT}: no .mp4 files in ${ASSETS_DIR}\n` +
        `Each course needs ${LESSONS_PER_COURSE} lessons. Add royalty-free .mp4 files (< 50 MB each) there ` +
        `and run it again. Nothing was changed.`
    );
  }
  const files = [];
  for (const name of videos) {
    const full = path.join(ASSETS_DIR, name);
    const { size } = await fs.stat(full);
    if (size > MAX_VIDEO_BYTES) {
      throw new ScriptStop(`${SCRIPT}: ${name} is ${(size / 1048576).toFixed(1)} MB (max 50 MB). Nothing was changed.`);
    }
    files.push({ name, full, duration: await mp4DurationSeconds(full) });
  }
  return files;
}

// Reads the duration from the MP4 'mvhd' header so lessons and totals show real lengths.
// No ffprobe dependency. Fragmented MP4s (browser recordings) store 0 there and spread the length
// over their fragments: those return null and the app shows "0s". Normal exports work.
async function mp4DurationSeconds(file) {
  const buf = await fs.readFile(file);
  const at = buf.indexOf("mvhd");
  if (at < 4) return null;
  const version = buf[at + 4];
  let timescale;
  let duration;
  if (version === 1) {
    timescale = buf.readUInt32BE(at + 24);
    duration = Number(buf.readBigUInt64BE(at + 28));
  } else {
    timescale = buf.readUInt32BE(at + 16);
    duration = buf.readUInt32BE(at + 20);
  }
  const seconds = Math.round(duration / timescale);
  return timescale > 0 && seconds > 0 && seconds < 24 * 3600 ? seconds : null;
}

function demoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ScriptStop(
      `${SCRIPT}: set DEMO_PASSWORD (at least ${MIN_PASSWORD_LENGTH} characters) in server/.env or the ` +
        `environment. It becomes the password of both demo accounts. Nothing was changed.`
    );
  }
  return password;
}

// Copies a file into uploads/ under a server-chosen name, like the upload middleware does.
async function copyToUploads(source) {
  const name = `${randomUUID()}${path.extname(source).toLowerCase()}`;
  await fs.copyFile(source, path.join(UPLOADS_DIR, name));
  return `${UPLOADS_URL_PREFIX}${name}`;
}

async function upsertUser(conn, account, passwordHash) {
  await conn.query(
    `INSERT INTO users (email, password, role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
    [account.email, passwordHash, account.role]
  );
  const [[user]] = await conn.query("SELECT id FROM users WHERE email = ?", [account.email]);
  await conn.query(
    `INSERT INTO user_profiles (user_id, full_name, bio) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), bio = VALUES(bio)`,
    [user.id, account.fullName, account.bio ?? null]
  );
  return user.id;
}

async function main() {
  refuseProductionUnlessForced(SCRIPT);
  // Every check that can fail runs before the first write.
  const videos = await findVideos();
  const password = demoPassword();
  for (const course of COURSES) await fs.access(path.join(THUMBS_DIR, course.thumbnail));
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const copied = []; // files written in this run, removed again if the transaction fails
  const replaced = []; // files of rows this run replaced, removed only after the commit
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const sellerId = await upsertUser(conn, SELLER, passwordHash);
    const studentId = await upsertUser(conn, STUDENT, passwordHash);
    // Instructor profile pages need at least one qualification (RequireProfileCompletion).
    await conn.query(
      `INSERT IGNORE INTO qualifications (user_id, title, institution) VALUES (?, ?, ?)`,
      [sellerId, SELLER.qualification.title, SELLER.qualification.institution]
    );

    const courseIds = [];
    const firstLessonIds = [];
    let videoIndex = 0;
    for (const course of COURSES) {
      // A course is identified by (seller, title): re-runs update it in place.
      const [[existing]] = await conn.query("SELECT id FROM courses WHERE seller_id = ? AND title = ?", [
        sellerId,
        course.title,
      ]);
      let courseId = existing?.id;
      if (courseId) {
        await conn.query("UPDATE courses SET description = ?, price = ? WHERE id = ?", [
          course.description,
          course.price,
          courseId,
        ]);
        // Replace the media. Explicit deletes (also of the progress rows that point at it) because
        // the local database may be MyISAM, where nothing cascades.
        const [oldMedia] = await conn.query("SELECT id, url FROM course_media WHERE course_id = ?", [courseId]);
        if (oldMedia.length) {
          await conn.query("DELETE FROM lesson_progress WHERE course_media_id IN (?)", [oldMedia.map((m) => m.id)]);
          await conn.query("DELETE FROM course_media WHERE course_id = ?", [courseId]);
          replaced.push(...oldMedia.map((m) => m.url));
        }
      } else {
        const [res] = await conn.query("INSERT INTO courses (title, description, price, seller_id) VALUES (?, ?, ?, ?)", [
          course.title,
          course.description,
          course.price,
          sellerId,
        ]);
        courseId = res.insertId;
      }
      courseIds.push(courseId);

      const thumbUrl = await copyToUploads(path.join(THUMBS_DIR, course.thumbnail));
      copied.push(thumbUrl);
      await conn.query(
        "INSERT INTO course_media (course_id, type, url, title, order_index) VALUES (?, 'image', ?, ?, 0)",
        [courseId, thumbUrl, `${course.title} thumbnail`]
      );

      for (let i = 0; i < LESSONS_PER_COURSE; i++) {
        const video = videos[videoIndex++ % videos.length]; // fewer files than lessons: reuse them
        const url = await copyToUploads(video.full);
        copied.push(url);
        const [res] = await conn.query(
          `INSERT INTO course_media (course_id, type, url, title, description, duration, order_index, is_preview)
           VALUES (?, 'video', ?, ?, ?, ?, ?, ?)`,
          [courseId, url, course.lessons[i], `Lesson ${i + 1} of ${course.title}`, video.duration, i + 1, i === 0 ? 1 : 0]
        );
        if (i === 0) firstLessonIds.push(res.insertId);
      }
    }

    // Student state: one course half done, one favorite.
    const enrolledId = courseIds[ENROLLED_COURSE];
    // Look up, then update or insert, so running the seed again keeps a single enrollment
    // even on a database without the (user_id, course_id) unique key.
    const [[enrollment]] = await conn.query("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [
      studentId,
      enrolledId,
    ]);
    if (enrollment) {
      await conn.query("UPDATE enrollments SET progress = ?, last_watched_media_id = ? WHERE id = ?", [
        STUDENT_PROGRESS,
        firstLessonIds[ENROLLED_COURSE],
        enrollment.id,
      ]);
    } else {
      await conn.query(
        "INSERT INTO enrollments (user_id, course_id, progress, last_watched_media_id) VALUES (?, ?, ?, ?)",
        [studentId, enrolledId, STUDENT_PROGRESS, firstLessonIds[ENROLLED_COURSE]]
      );
    }
    // Same columns the server writes (EnrollmentService.updateProgress).
    await conn.query(
      `INSERT INTO lesson_progress (user_id, course_media_id, completed, completed_at) VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed = 1`,
      [studentId, firstLessonIds[ENROLLED_COURSE]]
    );
    await conn.query("INSERT IGNORE INTO favorites (user_id, course_id) VALUES (?, ?)", [
      studentId,
      courseIds[FAVORITE_COURSE],
    ]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    await Promise.all(copied.map(removeUploadFile));
    throw err;
  } finally {
    conn.release();
  }
  await Promise.all(replaced.map(removeUploadFile));

  console.log(`${SCRIPT}: done. ${COURSES.length} courses, ${COURSES.length * LESSONS_PER_COURSE} lessons.`);
  console.log(`  instructor: ${SELLER.email}`);
  console.log(`  student:    ${STUDENT.email}`);
  console.log(`  password:   the DEMO_PASSWORD you set`);
}

runScript(main, db);
