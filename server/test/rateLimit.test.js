// The login and register limits. Their counters live in memory per app instance, so they get their own file:
// Vitest gives every file its own copy of the app, so no other file's requests count toward these limits.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { PASSWORD, makeUser, resetTables } from "./helpers.js";

const LOGIN_MAX_FAILED = 10; // rateLimitMiddleware.js
const REGISTER_MAX = 5;

let user;
beforeAll(async () => {
  await resetTables();
  user = await makeUser("user");
});

describe("login limit", () => {
  it("successful logins never count", async () => {
    for (let i = 0; i < LOGIN_MAX_FAILED + 2; i += 1) {
      const res = await request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
    }
  });

  it(`${LOGIN_MAX_FAILED} wrong passwords -> 401, the next one -> 429 with a readable message`, async () => {
    for (let i = 0; i < LOGIN_MAX_FAILED; i += 1) {
      const res = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
      expect(res.status).toBe(401);
    }
    const blocked = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/too many/i);
  });

  it("once blocked, even the right password -> 429 (the limit is per address, not per guess)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(429);
  });
});

describe("register limit", () => {
  it(`${REGISTER_MAX} attempts are answered, the next one -> 429`, async () => {
    for (let i = 0; i < REGISTER_MAX; i += 1) {
      const res = await request(app).post("/api/auth/register").send({ email: `limit-${i}@lumen.test`, password: "Abcd1!xy", role: "user" });
      expect(res.status).toBe(201);
    }
    const blocked = await request(app).post("/api/auth/register").send({ email: "limit-extra@lumen.test", password: "Abcd1!xy", role: "user" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/too many/i);
  });
});
