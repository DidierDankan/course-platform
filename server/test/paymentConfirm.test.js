// POST /api/payments/confirm: the buyer's return from Stripe also records the purchase, so a sleeping server (Render's
// free plan) that misses the webhook doesn't leave a paying buyer without their course. The browser only sends an id;
// the session is read FROM STRIPE. Webhook and confirm share one idempotent function: together they still make one
// enrollment and one paid payment.
// Stripe's API can't be called from tests, so checkout.sessions.retrieve returns a session we choose (vi.spyOn).
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import db from "../db/connection.js";
import PaymentService from "../db/PaymentService.js";
import { stripe } from "../lib/stripe.js";
import { login, makeCourse, makeUser, resetTables } from "./helpers.js";

const SESSION_ID = "cs_test_a1B2c3D4e5F6";

const confirm = (cookie, sessionId = SESSION_ID) =>
  request(app).post("/api/payments/confirm").set("Cookie", cookie).send({ session_id: sessionId });

const webhook = (session) => {
  const payload = JSON.stringify({ id: "evt_test_confirm", object: "event", type: "checkout.session.completed", data: { object: session } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: config.stripe.webhookSecret });
  return request(app).post("/api/payments/webhook").set("Content-Type", "application/json").set("Stripe-Signature", signature).send(payload);
};

const stripeReturns = (session) => vi.spyOn(stripe.checkout.sessions, "retrieve").mockResolvedValue(session);
const counts = async (userId, courseId) => {
  const [[{ e }]] = await db.query("SELECT COUNT(*) AS e FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  const [payments] = await db.query("SELECT status FROM payments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  return { enrollments: e, payments: payments.map((p) => p.status) };
};

let buyer, buyerCookie, course, session;
beforeEach(async () => {
  await resetTables();
  const seller = await makeUser("seller");
  course = await makeCourse(await login(seller), { price: "20" });
  buyer = await makeUser("user");
  buyerCookie = await login(buyer);
  // What checkout does after Stripe creates the session
  await PaymentService.upsertPendingPayment({ userId: buyer.id, courseId: course.id, amount: 20, sessionId: SESSION_ID });
  session = {
    id: SESSION_ID,
    object: "checkout.session",
    payment_status: "paid",
    metadata: { user_id: String(buyer.id), course_id: String(course.id) },
  };
});
afterEach(() => vi.restoreAllMocks());

describe("who and what may confirm", () => {
  it("logged out -> 401", async () => {
    expect((await request(app).post("/api/payments/confirm").send({ session_id: SESSION_ID })).status).toBe(401);
  });

  it.each([
    ["missing", undefined],
    ["not a Checkout session id", "pi_123"],
    ["a list", [SESSION_ID]],
    ["too long", `cs_test_${"a".repeat(300)}`],
  ])("session_id %s -> 400, and Stripe isn't even asked", async (_, sessionId) => {
    const spy = stripeReturns(session);
    const res = await request(app).post("/api/payments/confirm").set("Cookie", buyerCookie).send({ session_id: sessionId });
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("a session Stripe doesn't know -> 404", async () => {
    vi.spyOn(stripe.checkout.sessions, "retrieve").mockRejectedValue(
      Object.assign(new Error("No such checkout.session"), { type: "StripeInvalidRequestError", code: "resource_missing", statusCode: 404 })
    );
    expect((await confirm(buyerCookie)).status).toBe(404);
  });

  it("someone else's session -> 403, and nothing is recorded (no claiming another buyer's purchase)", async () => {
    stripeReturns(session);
    const other = await makeUser("user");
    expect((await confirm(await login(other))).status).toBe(403);
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 0, payments: ["pending"] });
    expect(await counts(other.id, course.id)).toEqual({ enrollments: 0, payments: [] });
  });

  it("not paid yet -> 409, nothing recorded", async () => {
    stripeReturns({ ...session, payment_status: "unpaid" });
    expect((await confirm(buyerCookie)).status).toBe(409);
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 0, payments: ["pending"] });
  });
});

describe("recording the purchase", () => {
  it("a paid session -> 200 with the course id; enrolled and the payment marked paid", async () => {
    stripeReturns(session);
    const res = await confirm(buyerCookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ courseId: course.id });
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 1, payments: ["paid"] });
  });

  it("confirm twice, then the webhook -> still one enrollment and one paid payment", async () => {
    stripeReturns(session);
    expect((await confirm(buyerCookie)).status).toBe(200);
    expect((await confirm(buyerCookie)).status).toBe(200);
    expect((await webhook(session)).status).toBe(200);
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 1, payments: ["paid"] });
  });

  it("the webhook first, then confirm (the normal case) -> one of each", async () => {
    stripeReturns(session);
    expect((await webhook(session)).status).toBe(200);
    expect((await confirm(buyerCookie)).status).toBe(200);
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 1, payments: ["paid"] });
  });

  it("confirm and the webhook at the same moment -> one of each", async () => {
    stripeReturns(session);
    const [a, b] = await Promise.all([confirm(buyerCookie), webhook(session)]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(await counts(buyer.id, course.id)).toEqual({ enrollments: 1, payments: ["paid"] });
  });
});
