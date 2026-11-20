// Registering signs the new account in, exactly like login: the same two HttpOnly cookies and one refresh-token row.
// A refused registration sets no cookie. Its own file: the register limit counts every attempt (5 an hour per address,
// per app instance), and these cases use 4.
import crypto from "node:crypto";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { resetTables } from "./helpers.js";

const PASSWORD = "Abcd1!xy";
const register = (body) => request(app).post("/api/auth/register").send(body);
const cookiesOf = (res) => res.headers["set-cookie"] ?? [];
const cookieNamed = (res, name) => cookiesOf(res).find((cookie) => cookie.startsWith(`${name}=`));
const asCookieHeader = (res) => cookiesOf(res).map((cookie) => cookie.split(";")[0]).join("; ");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

beforeAll(resetTables);

describe("register signs the new account in", () => {
  it("a seller -> 201, HttpOnly access + refresh cookies, /me knows them, one stored refresh token", async () => {
    const res = await register({ email: "new-seller@lumen.test", password: PASSWORD, role: "seller" });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(Number), email: "new-seller@lumen.test", role: "seller", isDemo: false });
    const access = cookieNamed(res, "token");
    const refresh = cookieNamed(res, "refreshToken");
    expect(access).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/Path=\/api\/auth/);

    const me = await request(app).get("/api/auth/me").set("Cookie", asCookieHeader(res));
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ id: res.body.user.id, role: "seller" });

    const refreshValue = decodeURIComponent(refresh.split(";")[0].slice("refreshToken=".length));
    const [rows] = await db.query("SELECT user_id FROM refresh_tokens WHERE token_hash = ?", [sha256(refreshValue)]);
    expect(rows).toEqual([{ user_id: res.body.user.id }]);
  });

  it("the refresh cookie from register works once, like one from login", async () => {
    const res = await register({ email: "new-student@lumen.test", password: PASSWORD, role: "user" });
    expect(res.status).toBe(201);

    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", asCookieHeader(res));
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user).toMatchObject({ id: res.body.user.id, role: "user" });
  });

  it("an email already registered -> 409 and no cookie", async () => {
    const res = await register({ email: "new-seller@lumen.test", password: PASSWORD, role: "user" });

    expect(res.status).toBe(409);
    expect(cookiesOf(res)).toEqual([]);
  });

  it("an admin role -> refused, no account and no cookie", async () => {
    const res = await register({ email: "would-be-admin@lumen.test", password: PASSWORD, role: "admin" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(cookiesOf(res)).toEqual([]);
    const [users] = await db.query("SELECT id FROM users WHERE email = ?", ["would-be-admin@lumen.test"]);
    expect(users).toEqual([]);
  });
});
