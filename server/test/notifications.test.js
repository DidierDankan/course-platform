// Stage 4c: sellers are told about new reviews and comments on their courses. The notification row is written in the
// same transaction as the review or comment, so neither can exist without the other. Polling, not WebSockets (TODO).
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import NotificationService from "../db/NotificationService.js";
import UserService from "../db/UserService.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const person = async (role, fullName) => {
  const user = await makeUser(role);
  if (fullName) await UserService.updateUserProfile(user.id, { full_name: fullName });
  return { ...user, cookie: await login(user) };
};
const review = (who, courseId, rating) => request(app).put(`/api/courses/${courseId}/reviews`).set("Cookie", who.cookie).send({ rating });
const comment = (who, courseId, body) => request(app).post(`/api/courses/${courseId}/comments`).set("Cookie", who.cookie).send({ body });
const inbox = (who, query = "") => request(app).get(`/api/notifications${query}`).set("Cookie", who.cookie);
const unread = async (who) => (await request(app).get("/api/notifications/unread-count").set("Cookie", who.cookie)).body.unread;
const countFor = async (userId) => (await db.query("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?", [userId]))[0][0].n;

let seller, otherSeller, course, sam, kim;
beforeAll(async () => {
  await resetTables();
  seller = await person("seller", "Maya Chen");
  otherSeller = await person("seller");
  course = await makeCourse(seller.cookie);
  sam = await person("user", "Sam Rivera");
  kim = await person("user", "Kim Park");
  await enroll(sam.cookie, course.id);
  await enroll(kim.cookie, course.id);
});
afterEach(() => vi.restoreAllMocks());

describe("what creates a notification", () => {
  it("a new review -> one notification for the course's seller; editing it -> no second one", async () => {
    expect((await review(sam, course.id, 4)).status).toBe(201);
    expect(await countFor(seller.id)).toBe(1);
    expect((await review(sam, course.id, 5)).status).toBe(200);
    expect(await countFor(seller.id)).toBe(1);
  });

  it("a student's comment -> one more; the seller's own comment -> none", async () => {
    await comment(kim, course.id, "Which clay do you use?");
    expect(await countFor(seller.id)).toBe(2);
    await comment(seller, course.id, "Stoneware, any brand.");
    expect(await countFor(seller.id)).toBe(2);
  });

  it("nobody else is notified", async () => {
    expect(await countFor(otherSeller.id)).toBe(0);
    expect(await countFor(sam.id)).toBe(0);
  });
});

describe("all or nothing", () => {
  it("if writing the notification fails, the review isn't saved either", async () => {
    const lee = await person("user");
    await enroll(lee.cookie, course.id);
    vi.spyOn(NotificationService, "add").mockRejectedValueOnce(new Error("injected failure"));
    expect((await review(lee, course.id, 3)).status).toBe(500);
    const [rows] = await db.query("SELECT id FROM reviews WHERE user_id = ?", [lee.id]);
    expect(rows).toHaveLength(0);
  });

  it("if writing the notification fails, the comment isn't saved either", async () => {
    vi.spyOn(NotificationService, "add").mockRejectedValueOnce(new Error("injected failure"));
    expect((await comment(sam, course.id, "lost on purpose")).status).toBe(500);
    const [rows] = await db.query("SELECT id FROM comments WHERE body = 'lost on purpose'");
    expect(rows).toHaveLength(0);
  });
});

describe("reading notifications", () => {
  it("logged out -> 401; a student -> 403", async () => {
    expect((await request(app).get("/api/notifications")).status).toBe(401);
    expect((await inbox(sam)).status).toBe(403);
  });

  it("newest first, with the course title, who did it ('Sam R.') and the rating; no emails", async () => {
    const res = await inbox(seller);
    expect(res.status).toBe(200);
    const [newest, older] = res.body.notifications;
    expect(newest).toMatchObject({ type: "comment", course_id: course.id, actor: "Kim P.", read: false });
    expect(older).toMatchObject({ type: "review", actor: "Sam R.", rating: 5, course_title: "Test course" });
    expect(res.text).not.toContain(sam.email);
    expect(res.text).not.toContain("Rivera");
  });

  it("another seller sees none of them", async () => {
    expect((await inbox(otherSeller)).body.notifications).toEqual([]);
  });

  it("unread count, then 'mark all read' -> 0 for that seller only", async () => {
    expect(await unread(seller)).toBe(2);
    const someoneElse = await person("seller");
    const theirCourse = await makeCourse(someoneElse.cookie);
    await enroll(kim.cookie, theirCourse.id);
    await comment(kim, theirCourse.id, "Hello");

    const res = await request(app).patch("/api/notifications/read").set("Cookie", seller.cookie);
    expect(res.status).toBe(200);
    expect(await unread(seller)).toBe(0);
    expect(await unread(someoneElse)).toBe(1);
    expect((await inbox(seller)).body.notifications.every((n) => n.read)).toBe(true);
  });

  it("paginates", async () => {
    const page1 = (await inbox(seller, "?limit=1&page=1")).body;
    const page2 = (await inbox(seller, "?limit=1&page=2")).body;
    expect(page1.notifications).toHaveLength(1);
    expect(page2.notifications[0].id).not.toBe(page1.notifications[0].id);
    expect([page1.hasMore, page2.hasMore]).toEqual([true, false]);
  });
});
