// server/scripts/seed-demo.js
// Demo data for the live site and screenshots: 1 demo instructor, 1 demo student, 4 courses with
// thumbnails (cut from the reference contact sheet) and 2 lessons each (the first is a free preview),
// a year of sales to 24 demo learners, reviews, comments and the instructor's notifications.
//
//   DEMO_PASSWORD=... npm run seed:demo      (NODE_ENV=production also needs --force)
//
// Videos: put royalty-free .mp4 files (< 50 MB each) in server/scripts/seed-assets/. They are not
// committed. With none there, the script stops before touching anything.
// Idempotent: re-running updates the same rows instead of adding copies.
//
// What the accounts and courses are: lib/demoContent.js. This script writes them (it needs the video files); the
// activity (purchases, progress, reviews, comments, notifications) comes from DemoService.rebuildActivity, the same code
// the server's daily reset runs. Every account here is marked is_demo, so the server refuses the writes that would
// break the demo (middleware/demoAccount.js).
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import db from "../db/connection.js";
import DemoService from "../db/DemoService.js";
import { ScriptStop, UPLOADS_DIR, UPLOADS_URL_PREFIX, refuseProductionUnlessForced, removeUploadFile, runScript } from "./lib.js";
import { DEMO_COURSES, DEMO_SELLER, DEMO_STUDENT, LESSONS_PER_COURSE } from "../lib/demoContent.js";
import { DEMO_LEARNERS, HISTORY_MONTHS, commentPlan, learnerEmail, reviewPlan, salesHistory } from "../lib/demoHistory.js";

const SCRIPT = "seed-demo";
const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
// SEED_ASSETS_DIR: another folder of demo videos (the tests point it at a temp folder; seed-assets isn't committed)
const ASSETS_DIR = process.env.SEED_ASSETS_DIR || path.join(SCRIPTS_DIR, "seed-assets");
const THUMBS_DIR = path.join(SCRIPTS_DIR, "seed-data", "thumbnails");
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 10; // same cost as UserService.createUser

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

// Every seeded account is a demo account (is_demo = 1): its password is public, so the server keeps it read-only where
// that matters. The demo learners share the password too, so they are marked as well.
async function upsertUser(conn, account, passwordHash) {
  await conn.query(
    `INSERT INTO users (email, password, role, is_demo) VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), is_demo = 1`,
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
  for (const course of DEMO_COURSES) await fs.access(path.join(THUMBS_DIR, course.thumbnail));
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const copied = []; // files written in this run, removed again if the transaction fails
  const replaced = []; // files of rows this run replaced, removed only after the commit
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const sellerId = await upsertUser(conn, DEMO_SELLER, passwordHash);
    const studentId = await upsertUser(conn, DEMO_STUDENT, passwordHash);
    // Instructor profile pages need at least one qualification (RequireProfileCompletion).
    await conn.query(
      `INSERT IGNORE INTO qualifications (user_id, title, institution) VALUES (?, ?, ?)`,
      [sellerId, DEMO_SELLER.qualification.title, DEMO_SELLER.qualification.institution]
    );
    const learnerIds = [];
    for (let n = 1; n <= DEMO_LEARNERS; n += 1) {
      learnerIds.push(await upsertUser(conn, { email: learnerEmail(n), role: "user", fullName: `Demo learner ${n}` }, passwordHash));
    }

    const courseIds = [];
    const firstLessonIds = [];
    let videoIndex = 0;
    for (const course of DEMO_COURSES) {
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
        // Replace the media, and the progress rows that point at it (anyone's: those lessons are gone).
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

    // Purchases, progress, reviews, comments, notifications: the same code as the daily reset, which also records the
    // time, so a server with DEMO_RESET_HOURS set doesn't reset again right after a seed.
    await DemoService.rebuildActivity(conn, { sellerId, studentId, learnerIds, courseIds, firstLessonIds });

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    await Promise.all(copied.map(removeUploadFile));
    throw err;
  } finally {
    conn.release();
  }
  await Promise.all(replaced.map(removeUploadFile));

  const sales = salesHistory();
  console.log(
    `${SCRIPT}: done. ${DEMO_COURSES.length} courses, ${DEMO_COURSES.length * LESSONS_PER_COURSE} lessons, ` +
      `${sales.length} past sales to ${DEMO_LEARNERS} demo learners (last ${HISTORY_MONTHS} months), ` +
      `${reviewPlan(sales).length} reviews, ${commentPlan(sales).comments.length + 1} comments.`
  );
  console.log(`  instructor: ${DEMO_SELLER.email}`);
  console.log(`  student:    ${DEMO_STUDENT.email}`);
  console.log(`  password:   the DEMO_PASSWORD you set`);
}

runScript(main, db);
