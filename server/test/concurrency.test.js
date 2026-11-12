// "Flood" tests: many identical or competing requests at once must leave the database correct.
// Results are counted with plain SQL, not through the services under test, so a service bug can't hide itself.
// The login flood is last: it uses up this file's login limit (each test file has its own copy of the app).
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import db from "../db/connection.js";
import PaymentService from "../db/PaymentService.js";
import { stripe } from "../lib/stripe.js";
import { login, makeCourse, makeUser, resetTables } from "./helpers.js";

const atOnce = (count, send) => Promise.all(Array.from({ length: count }, (_, i) => send(i)));
const statusCounts = (responses) =>
  responses.reduce((counts, res) => ({ ...counts, [res.status]: (counts[res.status] ?? 0) + 1 }), {});

let seller, student, sellerCookie, studentCookie;
beforeAll(async () => {
  await resetTables();
  seller = await makeUser("seller");
  student = await makeUser("user");
  sellerCookie = await login(seller);
  studentCookie = await login(student);
});

describe("Stripe webhook", () => {
  it("the same paid event 20 times at once -> 1 enrollment, 1 paid payment, every answer 200", async () => {
    const course = await makeCourse(sellerCookie, { price: "19.99" });
    // What checkout does after Stripe creates the session (the Stripe call itself can't run in tests).
    await PaymentService.upsertPendingPayment({ userId: student.id, courseId: course.id, amount: 19.99, sessionId: "cs_test_flood" });

    const payload = JSON.stringify({
      id: "evt_test_flood",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_flood", object: "checkout.session", payment_status: "paid",
        metadata: { user_id: String(student.id), course_id: String(course.id) } } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: config.stripe.webhookSecret });
    const responses = await atOnce(20, () =>
      request(app).post("/api/payments/webhook").set("Content-Type", "application/json").set("Stripe-Signature", signature).send(payload));

    expect(statusCounts(responses)).toEqual({ 200: 20 });
    const [enrollments] = await db.query("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [student.id, course.id]);
    const [payments] = await db.query("SELECT status FROM payments WHERE user_id = ? AND course_id = ?", [student.id, course.id]);
    expect(enrollments).toHaveLength(1);
    expect(payments).toEqual([{ status: "paid" }]);
  });
});

describe("profile", () => {
  it("20 different skill lists saved at once -> no 500, and the stored list is exactly one of them", async () => {
    const lists = Array.from({ length: 20 }, (_, i) => [`skill-${i}-a`, `skill-${i}-b`, `skill-${i}-c`]);
    const responses = await atOnce(20, (i) =>
      request(app).patch("/api/profile/edit").set("Cookie", studentCookie).send({ skills: JSON.stringify(lists[i]) }));

    expect(statusCounts(responses)).toEqual({ 200: 20 });
    const [rows] = await db.query("SELECT skill FROM user_skills WHERE user_id = ? ORDER BY skill", [student.id]);
    const stored = rows.map((row) => row.skill);
    expect(lists.map((list) => JSON.stringify([...list].sort()))).toContain(JSON.stringify(stored));
  });
});

describe("favorites", () => {
  it("the same favorite added 10 times at once -> one row", async () => {
    const course = await makeCourse(sellerCookie);
    const responses = await atOnce(10, () =>
      request(app).post("/api/favorites").set("Cookie", studentCookie).send({ course_id: course.id }));

    expect(statusCounts(responses)).toEqual({ 201: 10 });
    const [rows] = await db.query("SELECT id FROM favorites WHERE user_id = ? AND course_id = ?", [student.id, course.id]);
    expect(rows).toHaveLength(1);
  });
});

describe("free enrollment", () => {
  it("the same free course enrolled 10 times at once -> one row, one 201, the rest 409 (no 500)", async () => {
    const course = await makeCourse(sellerCookie);
    const responses = await atOnce(10, () =>
      request(app).post("/api/enrollments").set("Cookie", studentCookie).send({ course_id: course.id }));

    expect(statusCounts(responses)).toEqual({ 201: 1, 409: 9 });
    const [rows] = await db.query("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [student.id, course.id]);
    expect(rows).toHaveLength(1);
  });
});

describe("login limit under a flood", () => {
  it("30 wrong logins at once -> exactly 10 answer 401, the other 20 answer 429", async () => {
    const responses = await atOnce(30, () =>
      request(app).post("/api/auth/login").send({ email: student.email, password: "wrong-password" }));
    expect(statusCounts(responses)).toEqual({ 401: 10, 429: 20 });
  });
});
