// GET /api/dashboard/seller/stats: a seller's own numbers for the last 12 months (months counted in UTC).
// Setup goes through the real code (routes, PaymentService like checkout + webhook do); only the dates are moved into
// the past with plain SQL, which the app has no route for.
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import PaymentService from "../db/PaymentService.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

// "Now" is pinned, so the 12-month window is always December 2025 to November 2026.
const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);
const utc = (y, m, d, h = 12, min = 0) => Math.floor(Date.UTC(y, m - 1, d, h, min) / 1000); // m is 1-12
const MONTHS = ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];

const stats = (cookie) => request(app).get("/api/dashboard/seller/stats").set("Cookie", cookie);
const enrolledAt = (userId, courseId, when) =>
  db.query("UPDATE enrollments SET enrolled_at = FROM_UNIXTIME(?) WHERE user_id = ? AND course_id = ?", [when, userId, courseId]);

// A paid purchase the way checkout + the webhook record it, then dated `when`.
async function buy(user, courseId, price, when) {
  await PaymentService.upsertPendingPayment({ userId: user.id, courseId, amount: price, sessionId: `cs_${user.id}_${courseId}` });
  await PaymentService.markPaymentPaid({ userId: user.id, courseId, sessionId: `cs_${user.id}_${courseId}` });
  await PaymentService.createEnrollmentIfNeeded({ userId: user.id, courseId });
  await db.query("UPDATE payments SET payment_date = FROM_UNIXTIME(?) WHERE user_id = ? AND course_id = ?", [when, user.id, courseId]);
  await enrolledAt(user.id, courseId, when);
}

let sellerCookie, studentCookie, students, free, paid;
beforeAll(async () => {
  await resetTables();
  const seller = await makeUser("seller");
  sellerCookie = await login(seller);
  free = await makeCourse(sellerCookie);
  paid = await makeCourse(sellerCookie, { price: "20" });
  await makeCourse(sellerCookie); // no students: must not appear in the top list

  students = await Promise.all([1, 2, 3, 4, 5, 6].map(() => makeUser("user")));
  const [s1, s2, s3, s4, s5, s6] = students;
  studentCookie = await login(s1);

  // free course: one student in March, one in November, one before the window (October 2025)
  await enroll(studentCookie, free.id);
  await enrolledAt(s1.id, free.id, utc(2026, 3, 15));
  await enroll(await login(s3), free.id);
  await enrolledAt(s3.id, free.id, utc(2026, 11, 2));
  await enroll(await login(s6), free.id);
  await enrolledAt(s6.id, free.id, utc(2025, 10, 20));

  // paid course: bought at 23:30 UTC on 31 March (still March in UTC), and in November; one checkout never paid
  await buy(s2, paid.id, 20, utc(2026, 3, 31, 23, 30));
  await buy(s4, paid.id, 20, utc(2026, 11, 5));
  await PaymentService.upsertPendingPayment({ userId: s5.id, courseId: paid.id, amount: 20, sessionId: "cs_pending" });

  // another seller's course, with a paid student in the window: never counted for our seller
  const otherSeller = await login(await makeUser("seller"));
  const other = await makeCourse(otherSeller, { price: "50" });
  await buy(s1, other.id, 50, utc(2026, 6, 1));

  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterAll(() => vi.useRealTimers());

describe("access", () => {
  it("logged out -> 401", async () => {
    expect((await request(app).get("/api/dashboard/seller/stats")).status).toBe(401);
  });

  it("a student -> 403", async () => {
    expect((await stats(studentCookie)).status).toBe(403);
  });
});

describe("the seller's numbers", () => {
  let body;
  beforeAll(async () => {
    const res = await stats(sellerCookie);
    expect(res.status).toBe(200);
    body = res.body;
  });

  it("12 months, oldest first, every month present", () => {
    expect(body.months.map((m) => m.month)).toEqual(MONTHS);
  });

  it("students per month: own courses only, free + paid, nothing from before the window", () => {
    const byMonth = Object.fromEntries(body.months.map((m) => [m.month, m.students]));
    expect(byMonth["2026-03"]).toBe(2);
    expect(byMonth["2026-11"]).toBe(2);
    expect(byMonth["2026-06"]).toBe(0); // the other seller's sale
    expect(body.months.reduce((sum, m) => sum + m.students, 0)).toBe(4);
  });

  it("revenue per month: paid payments only; 23:30 UTC on 31 March counts in March", () => {
    const byMonth = Object.fromEntries(body.months.map((m) => [m.month, m.revenue]));
    expect(byMonth["2026-03"]).toBe(20);
    expect(byMonth["2026-04"]).toBe(0);
    expect(byMonth["2026-11"]).toBe(20);
    expect(byMonth["2026-06"]).toBe(0);
  });

  it("top courses: by students, revenue breaks the tie, revenue not multiplied by the join, no empty course", () => {
    expect(body.topCourses.map((c) => [c.id, c.students, c.revenue])).toEqual([
      [paid.id, 2, 40],
      [free.id, 2, 0],
    ]);
  });

  it("totals are the sums of the months", () => {
    expect(body.totals).toEqual({ students: 4, revenue: 40 });
  });

  it("no student's email or name in the answer", () => {
    const text = JSON.stringify(body);
    for (const s of students) expect(text).not.toContain(s.email);
  });
});

describe("top courses list", () => {
  it("shows at most 5 courses", async () => {
    const seller = await login(await makeUser("seller"));
    const learner = await makeUser("user");
    const learnerCookie = await login(learner);
    for (let i = 0; i < 6; i += 1) {
      const course = await makeCourse(seller);
      await enroll(learnerCookie, course.id);
    }
    const res = await stats(seller);
    expect(res.status).toBe(200);
    expect(res.body.topCourses).toHaveLength(5);
  });

  it("a new seller gets 12 zero months and an empty list, not an error", async () => {
    const res = await stats(await login(await makeUser("seller")));
    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(12);
    expect(res.body.months.every((m) => m.students === 0 && m.revenue === 0)).toBe(true);
    expect(res.body).toMatchObject({ topCourses: [], totals: { students: 0, revenue: 0 } });
  });
});
