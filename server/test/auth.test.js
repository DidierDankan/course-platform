// Stage 1 security checks: who gets in, with which token, and what the server says when they don't.
// 401 = not authenticated (no token, bad token, expired, wrong kind); 403 = authenticated but not allowed.
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import { stripe } from "../lib/stripe.js";
import { login, makeUser, resetTables } from "./helpers.js";

const ACCESS_LIFETIME_MS = 15 * 60 * 1000; // helpers/tokens.js: access tokens expire after 15 minutes
const OTHER_ORIGIN = "https://evil.example";

// "token=a; refreshToken=b" -> the value of one cookie
const cookieValue = (cookieHeader, name) =>
  cookieHeader.split("; ").find((pair) => pair.startsWith(`${name}=`)).slice(name.length + 1);

// A token claiming to be an admin with no signature at all (alg "none"). The server pins HS256, so it must refuse it.
const unsignedToken = (payload) => {
  const part = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${part({ alg: "none", typ: "JWT" })}.${part(payload)}.`;
};

let student, studentCookie, access, refresh;
beforeAll(async () => {
  await resetTables();
  student = await makeUser("user");
  studentCookie = await login(student);
  access = cookieValue(studentCookie, "token");
  refresh = cookieValue(studentCookie, "refreshToken");
});

afterEach(() => vi.useRealTimers());

describe("access token", () => {
  it("a valid access token reads the user (control)", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", studentCookie);
    expect(res.status).toBe(200);
  });

  it("no cookie -> 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("expired access token -> 401, not 403", async () => {
    // Fake only the clock: the real token from login is checked 16 minutes "later".
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + ACCESS_LIFETIME_MS + 60_000);
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${access}`);
    expect(res.status).toBe(401);
  });

  it("refresh token used as an access token -> 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${refresh}`);
    expect(res.status).toBe(401);
  });

  it("unsigned token (alg none) claiming admin -> 401", async () => {
    const forged = unsignedToken({ id: student.id, email: student.email, role: "admin", type: "access" });
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${forged}`);
    expect(res.status).toBe(401);
  });

  it("tampered token (role changed, old signature kept) -> 401", async () => {
    const [header, payload, signature] = access.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    const promoted = Buffer.from(JSON.stringify({ ...claims, role: "admin" })).toString("base64url");
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${header}.${promoted}.${signature}`);
    expect(res.status).toBe(401);
  });
});

describe("refresh token", () => {
  it("a valid refresh token gets a new access token (control)", async () => {
    const res = await request(app).get("/api/auth/refresh").set("Cookie", `refreshToken=${refresh}`);
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"].some((cookie) => cookie.startsWith("token="))).toBe(true);
  });

  it("access token used as a refresh token -> 401", async () => {
    const res = await request(app).get("/api/auth/refresh").set("Cookie", `refreshToken=${access}`);
    expect(res.status).toBe(401);
  });

  it("no refresh cookie -> 401", async () => {
    const res = await request(app).get("/api/auth/refresh");
    expect(res.status).toBe(401);
  });
});

describe("roles", () => {
  it("a student creating a course -> 403 (authenticated, wrong role)", async () => {
    const res = await request(app).post("/api/courses").set("Cookie", studentCookie).field("title", "T");
    expect(res.status).toBe(403);
  });

  it("a seller opening the student dashboard -> 403", async () => {
    const sellerCookie = await login(await makeUser("seller"));
    const res = await request(app).get("/api/dashboard/me/dashboard").set("Cookie", sellerCookie);
    expect(res.status).toBe(403);
  });

  it("no cookie on a role-guarded route -> 401, not 403", async () => {
    const res = await request(app).post("/api/courses").field("title", "T");
    expect(res.status).toBe(401);
  });
});

describe("Stripe webhook", () => {
  const payload = JSON.stringify({ id: "evt_test", object: "event", type: "checkout.session.completed", data: { object: {} } });
  const sendWebhook = (signature) => {
    const req = request(app).post("/api/payments/webhook").set("Content-Type", "application/json");
    return (signature ? req.set("Stripe-Signature", signature) : req).send(payload);
  };

  // Control: proves the 400s below come from the signature check, not from a broken request.
  // The event has no payment_status "paid", so the server acknowledges it and enrolls nobody.
  it("signed with our secret -> 200 (control)", async () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: config.stripe.webhookSecret });
    expect((await sendWebhook(signature)).status).toBe(200);
  });

  it("no signature -> 400", async () => {
    expect((await sendWebhook()).status).toBe(400);
  });

  it("signed with someone else's secret -> 400", async () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_not_ours" });
    expect((await sendWebhook(signature)).status).toBe(400);
  });

  it("signed with our secret but the body changed afterwards -> 400", async () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: config.stripe.webhookSecret });
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payload.replace("evt_test", "evt_other"));
    expect(res.status).toBe(400);
  });
});

describe("CORS and security headers", () => {
  it("the client's origin is allowed, with cookies", async () => {
    const res = await request(app).get("/").set("Origin", config.clientUrl);
    expect(res.headers["access-control-allow-origin"]).toBe(config.clientUrl);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("another origin is never echoed back", async () => {
    const res = await request(app).options("/api/auth/me").set("Origin", OTHER_ORIGIN).set("Access-Control-Request-Method", "GET");
    expect(res.headers["access-control-allow-origin"]).not.toBe(OTHER_ORIGIN);
  });

  it("helmet headers are on every answer", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["cross-origin-resource-policy"]).toBe("same-site");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
