// Authorization on courses, media, paid videos and free enrollment: being a seller (or being logged in) is not the same
// as owning the course or having paid for it. Every refusal has a control next to it (the owner, an admin, a buyer gets
// through), so a test can't pass just because the route is broken for everybody.
import fs from "node:fs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import db from "../db/connection.js";
import PaymentService from "../db/PaymentService.js";
import { VIDEO, enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const filesOnDisk = () => fs.readdirSync(config.uploadDir).length;
const courseRow = async (id) => (await db.query("SELECT title FROM courses WHERE id = ?", [id]))[0][0] ?? null;
const mediaRow = async (id) => (await db.query("SELECT id FROM course_media WHERE id = ?", [id]))[0][0] ?? null;
const enrollmentCount = async (userId, courseId) =>
  (await db.query("SELECT COUNT(*) AS n FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]))[0][0].n;

// A valid edit with a new video attached: if the ownership check were missing, it would succeed (200) and save the file.
const editCourse = (cookie, courseId) =>
  request(app)
    .put(`/api/courses/${courseId}`)
    .set("Cookie", cookie)
    .field("title", "Taken over")
    .field("description", "d")
    .field("price", "20")
    .field("meta[]", JSON.stringify({ title: "Extra lesson", description: "", duration: 30 }))
    .attach("videos", VIDEO, { filename: "extra.mp4", contentType: "video/mp4" });

// The paid lesson's file url, read through the owner-only media route.
const videoUrl = async (ownerCookie, courseId) =>
  (await request(app).get(`/api/courses/${courseId}/media`).set("Cookie", ownerCookie)).body.find((m) => m.type === "video").url;

let sellerA, sellerACookie, sellerBCookie, course;
beforeEach(async () => {
  await resetTables();
  sellerA = await makeUser("seller");
  sellerACookie = await login(sellerA);
  sellerBCookie = await login(await makeUser("seller"));
  course = await makeCourse(sellerACookie, { price: "20" });
});

describe("seller B can't manage seller A's course", () => {
  it("edit -> 403, the course is unchanged and the attached video is never saved", async () => {
    const before = filesOnDisk();
    expect((await editCourse(sellerBCookie, course.id)).status).toBe(403);
    expect(await courseRow(course.id)).toEqual({ title: "Test course" });
    expect(filesOnDisk()).toBe(before);
  });

  it("delete -> 403, the course and its lesson are still there", async () => {
    expect((await request(app).delete(`/api/courses/${course.id}`).set("Cookie", sellerBCookie)).status).toBe(403);
    expect(await courseRow(course.id)).not.toBeNull();
    expect(await mediaRow(course.videoId)).not.toBeNull();
  });

  it("delete one of its lessons -> 403, the lesson is still there", async () => {
    expect((await request(app).delete(`/api/courses/media/${course.videoId}`).set("Cookie", sellerBCookie)).status).toBe(403);
    expect(await mediaRow(course.videoId)).not.toBeNull();
  });

  it("list its media (the paid video urls) -> 403", async () => {
    expect((await request(app).get(`/api/courses/${course.id}/media`).set("Cookie", sellerBCookie)).status).toBe(403);
  });

  it("a student can't edit or delete a course at all -> 403", async () => {
    const student = await login(await makeUser("user"));
    expect((await editCourse(student, course.id)).status).toBe(403);
    expect((await request(app).delete(`/api/courses/${course.id}`).set("Cookie", student)).status).toBe(403);
    expect(await courseRow(course.id)).toEqual({ title: "Test course" });
  });

  it("control: the owner edits and deletes a lesson; an admin deletes the course", async () => {
    expect((await editCourse(sellerACookie, course.id)).status).toBe(200);
    expect(await courseRow(course.id)).toEqual({ title: "Taken over" });
    expect((await request(app).delete(`/api/courses/media/${course.videoId}`).set("Cookie", sellerACookie)).status).toBe(200);
    expect(await mediaRow(course.videoId)).toBeNull();

    const admin = await login(await makeUser("admin"));
    expect((await request(app).delete(`/api/courses/${course.id}`).set("Cookie", admin)).status).toBe(200);
    expect(await courseRow(course.id)).toBeNull();
  });
});

describe("a paid video needs an enrollment", () => {
  it("a signed-in student who hasn't bought it -> 403 on the file and on the watch page", async () => {
    const student = await login(await makeUser("user"));
    const url = await videoUrl(sellerACookie, course.id);
    expect((await request(app).get(url).set("Cookie", student)).status).toBe(403);
    expect((await request(app).get(`/api/courses/${course.id}/watch`).set("Cookie", student)).status).toBe(403);
  });

  it("another seller who doesn't own it -> 403 on the file", async () => {
    const url = await videoUrl(sellerACookie, course.id);
    expect((await request(app).get(url).set("Cookie", sellerBCookie)).status).toBe(403);
  });

  it("control: after buying it the student gets the file (never cached as shared), and so does the owner", async () => {
    const buyer = await makeUser("user");
    const buyerCookie = await login(buyer);
    // What checkout + Stripe's webhook do, through the same service the webhook uses
    await PaymentService.upsertPendingPayment({ userId: buyer.id, courseId: course.id, amount: 20, sessionId: "cs_test_authz" });
    await PaymentService.recordPaidPurchase({ userId: buyer.id, courseId: course.id, sessionId: "cs_test_authz" });

    const url = await videoUrl(sellerACookie, course.id);
    const res = await request(app).get(url).set("Cookie", buyerCookie);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect((await request(app).get(`/api/courses/${course.id}/watch`).set("Cookie", buyerCookie)).status).toBe(200);
    expect((await request(app).get(url).set("Cookie", sellerACookie)).status).toBe(200);
  });
});

describe("free enrollment is for free courses only", () => {
  it("POST /api/enrollments on a paid course -> 403, no enrollment (paying goes through Stripe)", async () => {
    const student = await makeUser("user");
    const res = await request(app).post("/api/enrollments").set("Cookie", await login(student)).send({ course_id: course.id });
    expect(res.status).toBe(403);
    expect(await enrollmentCount(student.id, course.id)).toBe(0);
  });

  it("control: a free course -> 201, enrolled", async () => {
    const free = await makeCourse(sellerACookie);
    const student = await makeUser("user");
    await enroll(await login(student), free.id);
    expect(await enrollmentCount(student.id, free.id)).toBe(1);
  });
});
