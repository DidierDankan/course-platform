// Stage 3: refresh tokens are stored (as a SHA-256 hash), work once, and can be revoked.
// Threat: a stolen refresh cookie used to work for 7 days and logout couldn't stop it. Now every refresh replaces the
// token, a replayed old token ends that whole login (its "family"), and logout revokes it on the server.
// Times are moved with plain SQL on the database clock (the app has no route for that), never Node's clock.
import crypto from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { PASSWORD, makeUser, resetTables } from "./helpers.js";

const GRACE_SECONDS = 30; // RefreshTokenService: two tabs refreshing together
const sha256 = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signIn = (user) => request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD });
const refresh = (token) => request(app).post("/api/auth/refresh").set("Cookie", `refreshToken=${token}`);
const logout = (token) => request(app).post("/api/auth/logout").set("Cookie", `refreshToken=${token}`);

// The Set-Cookie line for a cookie that is being SET (a cleared cookie has an empty value).
const setCookie = (res, name) =>
  (res.headers["set-cookie"] ?? []).find((line) => line.startsWith(`${name}=`) && !line.startsWith(`${name}=;`));
const valueOf = (res, name) => setCookie(res, name)?.split(";")[0].slice(name.length + 1);
const clearedAt = (res, name, path) =>
  (res.headers["set-cookie"] ?? []).some(
    (line) => line.startsWith(`${name}=;`) && line.includes(`Path=${path};`) && line.includes("Expires=Thu, 01 Jan 1970")
  );

const rowOf = async (token) =>
  (await db.query("SELECT * FROM refresh_tokens WHERE token_hash = ?", [sha256(token)]))[0][0];
// Pretend the token was replaced `seconds` ago (moves revoked_at back on the database clock).
const replacedAgo = (token, seconds) =>
  db.query("UPDATE refresh_tokens SET revoked_at = NOW() - INTERVAL ? SECOND WHERE token_hash = ?", [seconds, sha256(token)]);

let user;
beforeEach(async () => {
  await resetTables();
  user = await makeUser("user");
});

describe("login", () => {
  it("stores only a hash of the refresh token, and sets it as an HttpOnly cookie for /api/auth only", async () => {
    const res = await signIn(user);
    expect(res.status).toBe(200);
    const token = valueOf(res, "refreshToken");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 random bytes, base64url

    const row = await rowOf(token);
    expect(row.user_id).toBe(user.id);
    const [[{ found }]] = await db.query("SELECT COUNT(*) AS found FROM refresh_tokens WHERE token_hash = ?", [token]);
    expect(found).toBe(0); // the token itself is never stored

    const cookie = setCookie(res, "refreshToken");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/api/auth");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("clears the old refresh cookie that browsers still hold at Path=/", async () => {
    expect(clearedAt(await signIn(user), "refreshToken", "/")).toBe(true);
  });

  it("deletes that user's expired tokens (there is no cron job to do it)", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    await db.query("UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL 1 SECOND WHERE token_hash = ?", [sha256(first)]);
    await signIn(user);
    expect(await rowOf(first)).toBeUndefined();
  });
});

describe("refresh rotates the token", () => {
  it("a token works once: the answer carries a new one, and only { id, email, role }", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    const res = await refresh(first);

    expect(res.status).toBe(200);
    const second = valueOf(res, "refreshToken");
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
    expect(valueOf(res, "token")).toBeDefined();
    expect(res.body.user).toEqual({ id: user.id, email: user.email, role: "user" });

    const old = await rowOf(first);
    const replacement = await rowOf(second);
    expect(old.revoked_at).not.toBeNull();
    expect(old.replaced_by_id).toBe(replacement.id);
    expect(replacement.family_id).toBe(old.family_id);
  });

  it("the replaced token within the grace window (another tab) -> 200 with an access token, and the cookie is left alone", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    await refresh(first);
    const res = await refresh(first);

    expect(res.status).toBe(200);
    expect(valueOf(res, "token")).toBeDefined();
    expect(setCookie(res, "refreshToken")).toBeUndefined();
  });

  it("the replaced token after the grace window -> 401, and the whole login is revoked (the newest token too)", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    const second = valueOf(await refresh(first), "refreshToken");
    await replacedAgo(first, GRACE_SECONDS + 5);

    expect((await refresh(first)).status).toBe(401); // replay: someone else has a copy
    expect((await refresh(second)).status).toBe(401); // so the legitimate session ends too
  });

  // 10 at once, not 2: two requests rarely overlap on a fast machine, so a missing row lock would go unnoticed.
  it("many tabs refreshing with the same token at once -> all 200, exactly one rotation, one new token", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    const answers = await Promise.all(Array.from({ length: 10 }, () => refresh(first)));

    expect(answers.map((res) => res.status)).toEqual(Array(10).fill(200));
    expect(answers.filter((res) => setCookie(res, "refreshToken")).length).toBe(1); // only the rotation sets a new cookie
    const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM refresh_tokens WHERE family_id = ?", [(await rowOf(first)).family_id]);
    expect(n).toBe(2);
  });

  it("an expired token -> 401", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    await db.query("UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL 1 SECOND WHERE token_hash = ?", [sha256(first)]);
    expect((await refresh(first)).status).toBe(401);
  });

  it("an unknown token -> 401", async () => {
    expect((await refresh(crypto.randomBytes(32).toString("base64url"))).status).toBe(401);
  });

  it("GET /api/auth/refresh no longer exists (refreshing changes state, so it is POST)", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    expect((await request(app).get("/api/auth/refresh").set("Cookie", `refreshToken=${first}`)).status).toBe(404);
  });

  it("a browser still sending the old Path=/ cookie after the new one still refreshes", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    const res = await request(app).post("/api/auth/refresh").set("Cookie", `refreshToken=${first}; refreshToken=old.jwt.value`);
    expect(res.status).toBe(200);
  });
});

describe("the database decides who the user is", () => {
  it("a role change applies at the next refresh (the token's old role is not trusted)", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    await db.query("UPDATE users SET role = 'seller' WHERE id = ?", [user.id]);

    const res = await refresh(first);
    expect(res.body.user.role).toBe("seller");
    const me = await request(app).get("/api/auth/me").set("Cookie", `token=${valueOf(res, "token")}`);
    expect(me.body.user.role).toBe("seller");
  });

  it("a deleted user can't refresh", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    await db.query("DELETE FROM users WHERE id = ?", [user.id]);
    expect((await refresh(first)).status).toBe(401);
  });
});

describe("logout", () => {
  it("revokes the token on the server: a copied cookie no longer works", async () => {
    const token = valueOf(await signIn(user), "refreshToken");
    const res = await logout(token); // no access token sent: logout only needs the refresh cookie

    expect(res.status).toBe(200);
    expect(clearedAt(res, "refreshToken", "/api/auth")).toBe(true);
    expect(clearedAt(res, "token", "/")).toBe(true);
    expect((await refresh(token)).status).toBe(401);
  });

  it("inside the grace window, the other tab's old token can't bring the session back", async () => {
    const first = valueOf(await signIn(user), "refreshToken");
    const second = valueOf(await refresh(first), "refreshToken");
    await logout(second);
    expect((await refresh(first)).status).toBe(401);
  });

  it("without a cookie it still answers 200 and clears the cookies", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(clearedAt(res, "refreshToken", "/api/auth")).toBe(true);
  });
});
