// Creating, editing and deleting a course is all-or-nothing: a failure at any step leaves the database and the uploads
// folder exactly as they were. Files are removed only after the database change is committed, never before.
// A failure is injected with vi.spyOn on one service step: the only way to make a real query fail at a chosen point.
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import db from "../db/connection.js";
import CourseService from "../db/CourseService.js";
import PaymentService from "../db/PaymentService.js";
import { IMAGE, VIDEO, enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const filesOnDisk = () => new Set(fs.readdirSync(config.uploadDir));
const fileOf = (url) => path.join(config.uploadDir, path.basename(url));
const mediaOf = async (courseId) =>
  (await db.query("SELECT id, type, title, url FROM course_media WHERE course_id = ? ORDER BY id", [courseId]))[0];
const failOnce = (step) => vi.spyOn(CourseService, step).mockRejectedValueOnce(new Error(`injected failure in ${step}`));

let seller;
beforeAll(async () => {
  await resetTables();
  seller = await login(await makeUser("seller"));
});
afterEach(() => vi.restoreAllMocks());

// A course with a thumbnail and two lessons, through the real route.
async function courseWithTwoLessons() {
  const res = await request(app)
    .post("/api/courses")
    .set("Cookie", seller)
    .field("title", "Original")
    .field("description", "d")
    .field("price", "0")
    .attach("thumbnail", IMAGE, { filename: "thumb.png", contentType: "image/png" })
    .field("meta[]", JSON.stringify({ title: "Lesson A", description: "", duration: 60 }))
    .attach("videos", VIDEO, { filename: "a.mp4", contentType: "video/mp4" })
    .field("meta[]", JSON.stringify({ title: "Lesson B", description: "", duration: 60 }))
    .attach("videos", VIDEO, { filename: "b.mp4", contentType: "video/mp4" });
  expect(res.status).toBe(201);
  const media = await mediaOf(res.body.course.id);
  return {
    id: res.body.course.id,
    thumbnail: media.find((m) => m.type === "image"),
    lessonA: media.find((m) => m.title === "Lesson A"),
    lessonB: media.find((m) => m.title === "Lesson B"),
  };
}

// One edit that touches everything: title, thumbnail, a new lesson, an edited lesson and a deleted lesson.
const editEverything = (course) =>
  request(app)
    .put(`/api/courses/${course.id}`)
    .set("Cookie", seller)
    .field("title", "Edited")
    .field("description", "d")
    .field("price", "0")
    .attach("thumbnail", IMAGE, { filename: "new-thumb.png", contentType: "image/png" })
    .field("meta[]", JSON.stringify({ title: "Lesson C", description: "", duration: 30 }))
    .attach("videos", VIDEO, { filename: "c.mp4", contentType: "video/mp4" })
    .field("existingVideos[]", JSON.stringify({ id: course.lessonA.id, title: "Lesson A edited", description: "", duration: 60 }))
    .field("deletedVideos[]", String(course.lessonB.id));

describe("create course", () => {
  it("a failure while saving the lessons -> 500, no course, and the uploaded files are removed", async () => {
    const [[{ n: coursesBefore }]] = await db.query("SELECT COUNT(*) AS n FROM courses");
    const diskBefore = filesOnDisk();
    failOnce("insertCourseVideos");

    const res = await request(app)
      .post("/api/courses")
      .set("Cookie", seller)
      .field("title", "Never saved")
      .field("description", "d")
      .field("price", "0")
      .attach("thumbnail", IMAGE, { filename: "thumb.png", contentType: "image/png" })
      .field("meta[]", JSON.stringify({ title: "L", description: "", duration: 10 }))
      .attach("videos", VIDEO, { filename: "l.mp4", contentType: "video/mp4" });

    expect(res.status).toBe(500);
    const [[{ n: coursesAfter }]] = await db.query("SELECT COUNT(*) AS n FROM courses");
    expect(coursesAfter).toBe(coursesBefore);
    expect(filesOnDisk()).toEqual(diskBefore);
  });
});

describe("update course", () => {
  it("a failure at the last step -> 500, and nothing changed: rows, old files, no new uploads left", async () => {
    const course = await courseWithTwoLessons();
    const rowsBefore = await mediaOf(course.id);
    const diskBefore = filesOnDisk();
    failOnce("deleteMediaRow");

    const res = await editEverything(course);

    expect(res.status).toBe(500);
    const [[{ title }]] = await db.query("SELECT title FROM courses WHERE id = ?", [course.id]);
    expect(title).toBe("Original");
    expect(await mediaOf(course.id)).toEqual(rowsBefore);
    expect(filesOnDisk()).toEqual(diskBefore); // lesson B's file and the old thumbnail are still there; c.mp4 is gone
  });

  it("success -> the replaced thumbnail and the deleted lesson's file are removed, after the save", async () => {
    const course = await courseWithTwoLessons();

    const res = await editEverything(course);

    expect(res.status).toBe(200);
    const media = await mediaOf(course.id);
    expect(media.filter((m) => m.type === "video").map((m) => m.title).sort()).toEqual(["Lesson A edited", "Lesson C"]);
    expect(media.filter((m) => m.type === "image")).toHaveLength(1);
    expect(fs.existsSync(fileOf(course.lessonB.url))).toBe(false);
    expect(fs.existsSync(fileOf(course.thumbnail.url))).toBe(false);
    for (const m of media) expect(fs.existsSync(fileOf(m.url))).toBe(true);
  });
});

describe("delete course", () => {
  it("a failure while deleting the course row -> 500, and its lessons and files are all still there", async () => {
    const course = await courseWithTwoLessons();
    const rowsBefore = await mediaOf(course.id);
    failOnce("deleteCourseRow");

    const res = await request(app).delete(`/api/courses/${course.id}`).set("Cookie", seller);

    expect(res.status).toBe(500);
    expect(await mediaOf(course.id)).toEqual(rowsBefore);
    for (const m of rowsBefore) expect(fs.existsSync(fileOf(m.url))).toBe(true);
  });

  it("a free course with an enrolled student -> 409, course, lessons, files and the enrollment are all still there", async () => {
    const course = await courseWithTwoLessons();
    const student = await makeUser("user");
    await enroll(await login(student), course.id);
    const rowsBefore = await mediaOf(course.id);

    const res = await request(app).delete(`/api/courses/${course.id}`).set("Cookie", seller);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/enrolled/);
    expect(await mediaOf(course.id)).toEqual(rowsBefore);
    for (const m of rowsBefore) expect(fs.existsSync(fileOf(m.url))).toBe(true);
    const [enrollments] = await db.query("SELECT id FROM enrollments WHERE course_id = ?", [course.id]);
    expect(enrollments).toHaveLength(1);
  });

  it("a paid course with a buyer -> 409 for the owner and for an admin; the payment record stays", async () => {
    const course = await makeCourse(seller, { price: "19.99" });
    const buyer = await makeUser("user");
    // What checkout + webhook do for a paid purchase (the Stripe calls themselves can't run in tests).
    await PaymentService.upsertPendingPayment({ userId: buyer.id, courseId: course.id, amount: 19.99, sessionId: "cs_test_delete" });
    await PaymentService.recordPaidPurchase({ userId: buyer.id, courseId: course.id, sessionId: "cs_test_delete" });
    const admin = await login(await makeUser("admin"));

    expect((await request(app).delete(`/api/courses/${course.id}`).set("Cookie", seller)).status).toBe(409);
    expect((await request(app).delete(`/api/courses/${course.id}`).set("Cookie", admin)).status).toBe(409);

    const [payments] = await db.query("SELECT status FROM payments WHERE course_id = ?", [course.id]);
    expect(payments).toEqual([{ status: "paid" }]);
    const [enrollments] = await db.query("SELECT user_id FROM enrollments WHERE course_id = ?", [course.id]);
    expect(enrollments).toEqual([{ user_id: buyer.id }]);
  });

  it("success -> course, rows and files are gone", async () => {
    const course = await courseWithTwoLessons();
    const rowsBefore = await mediaOf(course.id);

    const res = await request(app).delete(`/api/courses/${course.id}`).set("Cookie", seller);

    expect(res.status).toBe(200);
    const [courses] = await db.query("SELECT id FROM courses WHERE id = ?", [course.id]);
    expect(courses).toHaveLength(0);
    expect(await mediaOf(course.id)).toHaveLength(0);
    for (const m of rowsBefore) expect(fs.existsSync(fileOf(m.url))).toBe(false);
  });
});

describe("delete one lesson", () => {
  it("removes the row AND its video file (the file used to stay on disk forever)", async () => {
    const course = await courseWithTwoLessons();

    const res = await request(app).delete(`/api/courses/media/${course.lessonB.id}`).set("Cookie", seller);

    expect(res.status).toBe(200);
    expect((await mediaOf(course.id)).map((m) => m.id)).not.toContain(course.lessonB.id);
    expect(fs.existsSync(fileOf(course.lessonB.url))).toBe(false);
  });

  it("a failure -> 500, and the lesson and its file are still there", async () => {
    const course = await courseWithTwoLessons();
    failOnce("deleteMediaRow");

    const res = await request(app).delete(`/api/courses/media/${course.lessonB.id}`).set("Cookie", seller);

    expect(res.status).toBe(500);
    expect((await mediaOf(course.id)).map((m) => m.id)).toContain(course.lessonB.id);
    expect(fs.existsSync(fileOf(course.lessonB.url))).toBe(true);
  });
});
