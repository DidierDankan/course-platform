// The public demo: its password is on the login page, so the server refuses the writes that would break it for the next
// visitor (middleware/demoAccount.js), and a reset puts back what visitors may change (DemoService.resetIfDue).
// Setup runs the REAL seed:demo against lumen_test (a child process, like npm run seed:demo), with the tiny test video,
// so the seed and the reset are tested as the live site runs them. Visitors act through the app's own routes;
// assertions about the database use plain SQL.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import db from "../db/connection.js";
import DemoService from "../db/DemoService.js";
import PaymentService from "../db/PaymentService.js";
import { DEMO_COURSES, DEMO_INSTRUCTOR_EMAIL, DEMO_STUDENT_EMAIL, ENROLLED_COURSE } from "../lib/demoContent.js";
import { UNREAD_DEMO_NOTIFICATIONS, commentPlan, reviewPlan, salesHistory } from "../lib/demoHistory.js";
import { DEMO_REFUSAL } from "../middleware/demoAccount.js";
import { IMAGE, PASSWORD, VIDEO, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DAY_MS = 24 * 60 * 60 * 1000;

function runSeed() {
  const assets = fs.mkdtempSync(path.join(os.tmpdir(), "lumen-seed-assets-"));
  fs.writeFileSync(path.join(assets, "lesson.mp4"), VIDEO);
  try {
    const run = spawnSync(process.execPath, ["scripts/seed-demo.js"], {
      cwd: SERVER_DIR,
      env: { ...process.env, DEMO_PASSWORD: PASSWORD, SEED_ASSETS_DIR: assets },
      encoding: "utf8",
    });
    if (run.status !== 0) throw new Error(`seed:demo failed:\n${run.stdout}${run.stderr}`);
  } finally {
    fs.rmSync(assets, { recursive: true, force: true });
  }
}

const one = async (sql, params) => (await db.query(sql, params))[0][0].n;
const filesOnDisk = () => fs.readdirSync(config.uploadDir).length;

let demo, instructor, student, visitor, visitorCookie;
beforeAll(async () => {
  await resetTables();
  // Before any seed: nothing to reset, and the server says so instead of failing
  expect(await DemoService.resetIfDue({ maxAgeMs: 0 })).toEqual({ reset: false, reason: "no demo data" });

  runSeed();
  demo = await DemoService.findDemo();
  instructor = await login({ email: DEMO_INSTRUCTOR_EMAIL });
  student = await login({ email: DEMO_STUDENT_EMAIL });
  visitor = await makeUser("user");
  visitorCookie = await login(visitor);
});

describe("the seed", () => {
  it("marks every seeded account as a demo account, and nobody else", async () => {
    expect(demo).not.toBeNull();
    const accounts = [demo.sellerId, demo.studentId, ...demo.learnerIds];
    expect(await one("SELECT COUNT(*) n FROM users WHERE is_demo = 1 AND id IN (?)", [accounts])).toBe(accounts.length);
    expect(await one("SELECT COUNT(*) n FROM users WHERE is_demo = 1")).toBe(accounts.length);
  });

  it("writes the planned activity: the numbers the history plan promises", async () => {
    const sales = salesHistory();
    expect(await activityOf(demo)).toEqual(seededActivity(sales));
  });

  it("login says the account is a demo account (the client shows a note); a normal login says it isn't", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: DEMO_STUDENT_EMAIL, password: PASSWORD });
    expect(res.body.user).toMatchObject({ email: DEMO_STUDENT_EMAIL, isDemo: true });
    expect((await request(app).get("/api/auth/me").set("Cookie", student)).body.user.isDemo).toBe(true);
    expect((await request(app).get("/api/auth/me").set("Cookie", visitorCookie)).body.user.isDemo).toBe(false);
  });
});

describe("what a demo account can't do (it would break the demo for the next visitor)", () => {
  const editCourse = (cookie, courseId) =>
    request(app)
      .put(`/api/courses/${courseId}`)
      .set("Cookie", cookie)
      .field("title", "Vandalised")
      .field("description", "d")
      .field("price", "1")
      .field("meta[]", JSON.stringify({ title: "Extra", description: "", duration: 30 }))
      .attach("videos", VIDEO, { filename: "x.mp4", contentType: "video/mp4" });

  it("instructor: create a course -> 403 with a readable message, no file saved", async () => {
    const before = filesOnDisk();
    const res = await request(app)
      .post("/api/courses")
      .set("Cookie", instructor)
      .field("title", "New")
      .field("description", "d")
      .field("price", "0")
      .field("meta", JSON.stringify({ title: "L", description: "", duration: 30 }))
      .attach("videos", VIDEO, { filename: "x.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(DEMO_REFUSAL);
    expect(filesOnDisk()).toBe(before);
  });

  it("instructor: edit, delete a course, delete a lesson -> 403, and the demo course is exactly as seeded", async () => {
    const courseId = demo.courseIds[0];
    const lessons = await one("SELECT COUNT(*) n FROM course_media WHERE course_id = ?", [courseId]);
    const before = filesOnDisk();
    expect((await editCourse(instructor, courseId)).status).toBe(403);
    expect((await request(app).delete(`/api/courses/${courseId}`).set("Cookie", instructor)).status).toBe(403);
    expect((await request(app).delete(`/api/courses/media/${demo.firstLessonIds[0]}`).set("Cookie", instructor)).status).toBe(403);
    const [[course]] = await db.query("SELECT title FROM courses WHERE id = ?", [courseId]);
    expect(course.title).toBe(DEMO_COURSES[0].title);
    expect(await one("SELECT COUNT(*) n FROM course_media WHERE course_id = ?", [courseId])).toBe(lessons);
    expect(filesOnDisk()).toBe(before);
  });

  it("instructor and student: edit the profile (name, photo) -> 403, no photo saved", async () => {
    const before = filesOnDisk();
    for (const cookie of [instructor, student]) {
      const res = await request(app)
        .patch("/api/profile/edit")
        .set("Cookie", cookie)
        .field("full_name", "Renamed")
        .attach("profile_image", IMAGE, { filename: "me.png", contentType: "image/png" });
      expect(res.status).toBe(403);
    }
    expect(await one("SELECT COUNT(*) n FROM user_profiles WHERE full_name = 'Renamed'")).toBe(0);
    expect(filesOnDisk()).toBe(before);
  });

  it("control: a normal seller and student still do all of that", async () => {
    const seller = await login(await makeUser("seller"));
    const course = await makeCourse(seller);
    expect((await editCourse(seller, course.id)).status).toBe(200);
    expect((await request(app).patch("/api/profile/edit").set("Cookie", visitorCookie).send({ full_name: "Real Visitor" })).status).toBe(200);
  });

  it("the database decides, not the token: the same session is allowed once the flag is off", async () => {
    const res = () => request(app).patch("/api/profile/edit").set("Cookie", student).send({ bio: "hello" });
    expect((await res()).status).toBe(403);
    await db.query("UPDATE users SET is_demo = 0 WHERE id = ?", [demo.studentId]);
    try {
      expect((await res()).status).toBe(200); // same token, which still says isDemo: true
    } finally {
      await db.query("UPDATE users SET is_demo = 1 WHERE id = ?", [demo.studentId]);
    }
  });
});

describe("what a demo account still can do (what visitors come to try)", () => {
  it("student: favorite, review and comment on the enrolled course, save progress", async () => {
    const enrolled = demo.courseIds[ENROLLED_COURSE];
    expect((await request(app).post("/api/favorites").set("Cookie", student).send({ course_id: demo.courseIds[2] })).status).toBe(201);
    expect((await request(app).put(`/api/courses/${enrolled}/reviews`).set("Cookie", student).send({ rating: 5, body: "Great" })).status).toBe(201);
    expect((await request(app).post(`/api/courses/${enrolled}/comments`).set("Cookie", student).send({ body: "Hello" })).status).toBe(201);
    const progress = await request(app)
      .patch(`/api/enrollments/${enrolled}`)
      .set("Cookie", student)
      .send({ lastWatchedMediaId: demo.firstLessonIds[ENROLLED_COURSE], lastPositionSeconds: 10 });
    expect(progress.status).toBe(200);
  });

  it("instructor: dashboard stats, notifications, deleting a comment on the own course", async () => {
    expect((await request(app).get("/api/dashboard/seller/stats").set("Cookie", instructor)).status).toBe(200);
    expect((await request(app).patch("/api/notifications/read").set("Cookie", instructor)).status).toBe(200);
    const [[comment]] = await db.query("SELECT id FROM comments WHERE course_id IN (?) AND user_id <> ? LIMIT 1", [demo.courseIds, demo.sellerId]);
    expect((await request(app).delete(`/api/courses/comments/${comment.id}`).set("Cookie", instructor)).status).toBe(200);
  });
});

describe("the reset", () => {
  it("isn't due right after the seed (the seed records its time)", async () => {
    expect(await DemoService.resetIfDue({ maxAgeMs: DAY_MS })).toEqual({ reset: false, reason: "not due" });
  });

  it("a day later: what visitors changed is gone, the seeded activity is back, everyone else's data is untouched", async () => {
    // A visitor's own account buys a demo course and posts on it, and also reviews a normal seller's course
    const enrolled = demo.courseIds[0];
    await PaymentService.upsertPendingPayment({ userId: visitor.id, courseId: enrolled, amount: 89, sessionId: "cs_test_visitor" });
    await PaymentService.recordPaidPurchase({ userId: visitor.id, courseId: enrolled, sessionId: "cs_test_visitor" });
    expect((await request(app).post(`/api/courses/${enrolled}/comments`).set("Cookie", visitorCookie).send({ body: "spam" })).status).toBe(201);
    expect((await request(app).put(`/api/courses/${enrolled}/reviews`).set("Cookie", visitorCookie).send({ rating: 1 })).status).toBe(201);

    const seller = await login(await makeUser("seller"));
    const other = await makeCourse(seller, { price: "10" });
    await PaymentService.upsertPendingPayment({ userId: visitor.id, courseId: other.id, amount: 10, sessionId: "cs_test_other" });
    await PaymentService.recordPaidPurchase({ userId: visitor.id, courseId: other.id, sessionId: "cs_test_other" });
    expect((await request(app).put(`/api/courses/${other.id}/reviews`).set("Cookie", visitorCookie).send({ rating: 4 })).status).toBe(201);

    const media = await one("SELECT COUNT(*) n FROM course_media WHERE course_id IN (?)", [demo.courseIds]);
    const files = filesOnDisk();

    const result = await DemoService.resetIfDue({ now: new Date(Date.now() + DAY_MS + 60_000), maxAgeMs: DAY_MS });
    expect(result).toEqual({ reset: true });

    expect(await activityOf(demo)).toEqual(seededActivity(salesHistory()));
    // the visitor's posts on the demo course are gone, the purchase stays (their own account and money path)
    expect(await one("SELECT COUNT(*) n FROM comments WHERE user_id = ?", [visitor.id])).toBe(0);
    expect(await one("SELECT COUNT(*) n FROM reviews WHERE user_id = ? AND course_id = ?", [visitor.id, enrolled])).toBe(0);
    expect(await one("SELECT COUNT(*) n FROM enrollments WHERE user_id = ? AND course_id = ?", [visitor.id, enrolled])).toBe(1);
    // nothing outside the demo is touched
    expect(await one("SELECT COUNT(*) n FROM reviews WHERE user_id = ? AND course_id = ?", [visitor.id, other.id])).toBe(1);
    expect(await one("SELECT COUNT(*) n FROM user_profiles WHERE full_name = 'Real Visitor'")).toBe(1);
    // and the courses, lessons and files are as the seed left them
    expect(await one("SELECT COUNT(*) n FROM course_media WHERE course_id IN (?)", [demo.courseIds])).toBe(media);
    expect(filesOnDisk()).toBe(files);
  });

  it("two servers checking at once: exactly one resets (the second waits for the lock, then finds it done)", async () => {
    const now = new Date(Date.now() + 3 * DAY_MS);
    const results = await Promise.all([
      DemoService.resetIfDue({ now, maxAgeMs: DAY_MS }),
      DemoService.resetIfDue({ now, maxAgeMs: DAY_MS }),
    ]);
    expect(results.filter((r) => r.reset)).toHaveLength(1);
    expect(await activityOf(demo)).toEqual(seededActivity(salesHistory()));
  });
});

// What the demo's activity looks like in the database, counted with plain SQL
async function activityOf({ sellerId, studentId, learnerIds, courseIds }) {
  return {
    studentEnrollments: await one("SELECT COUNT(*) n FROM enrollments WHERE user_id = ?", [studentId]),
    studentProgress: await one("SELECT progress n FROM enrollments WHERE user_id = ? AND course_id = ?", [studentId, courseIds[ENROLLED_COURSE]]),
    // "Continue" opens the second lesson part way in (the first is the completed one)
    studentResumesSecondLesson:
      (await one("SELECT last_watched_media_id n FROM enrollments WHERE user_id = ? AND course_id = ?", [studentId, courseIds[ENROLLED_COURSE]])) ===
      (await one("SELECT id n FROM course_media WHERE course_id = ? AND type = 'video' ORDER BY order_index LIMIT 1 OFFSET 1", [courseIds[ENROLLED_COURSE]])),
    studentResumesInsideThatLesson: await one(
      `SELECT e.last_position_seconds <= COALESCE(cm.duration, 0) n
         FROM enrollments e JOIN course_media cm ON cm.id = e.last_watched_media_id
        WHERE e.user_id = ? AND e.course_id = ?`,
      [studentId, courseIds[ENROLLED_COURSE]]
    ),
    studentFavorites: await one("SELECT COUNT(*) n FROM favorites WHERE user_id = ?", [studentId]),
    studentReviewsAndComments:
      (await one("SELECT COUNT(*) n FROM reviews WHERE user_id = ?", [studentId])) +
      (await one("SELECT COUNT(*) n FROM comments WHERE user_id = ?", [studentId])),
    paidSales: await one("SELECT COUNT(*) n FROM payments WHERE user_id IN (?) AND status = 'paid'", [learnerIds]),
    reviewsOnDemoCourses: await one("SELECT COUNT(*) n FROM reviews WHERE course_id IN (?)", [courseIds]),
    commentsOnDemoCourses: await one("SELECT COUNT(*) n FROM comments WHERE course_id IN (?)", [courseIds]),
    notifications: await one("SELECT COUNT(*) n FROM notifications WHERE user_id = ?", [sellerId]),
    unread: await one("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL", [sellerId]),
  };
}

function seededActivity(sales) {
  const reviews = reviewPlan(sales).length;
  const comments = commentPlan(sales).comments.length;
  return {
    studentEnrollments: 1,
    studentProgress: 50,
    studentResumesSecondLesson: true,
    studentResumesInsideThatLesson: 1,
    studentFavorites: 1,
    studentReviewsAndComments: 0,
    paidSales: sales.length,
    reviewsOnDemoCourses: reviews,
    commentsOnDemoCourses: comments + 1, // + the instructor's answer
    notifications: reviews + comments, // the instructor's own comment notifies no one
    unread: UNREAD_DEMO_NOTIFICATIONS,
  };
}
