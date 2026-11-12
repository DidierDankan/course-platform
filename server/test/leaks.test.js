// Data a response must never contain, whoever asks. Each case reads the raw response text, so a field that moves or
// gets renamed is still caught.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { PASSWORD, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const BCRYPT_PREFIX = "$2"; // every bcrypt hash starts with $2a$, $2b$ or $2y$

let seller, sellerCookie, course;
beforeAll(async () => {
  await resetTables();
  seller = await makeUser("seller"); // no profile name on purpose: the case where the email used to show
  sellerCookie = await login(seller);
  course = await makeCourse(sellerCookie);
});

describe("public pages never show a seller's email", () => {
  it("course list (logged out)", async () => {
    const res = await request(app).get("/api/courses/all");
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === course.id)).toBe(true);
    expect(res.text).not.toContain(seller.email);
  });

  it("course page (logged out)", async () => {
    const res = await request(app).get(`/api/courses/${course.id}/public`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain(seller.email);
  });

  it("seller page, even for a logged-in visitor", async () => {
    const visitor = await login(await makeUser("user"));
    const res = await request(app).get(`/api/public/sellers/${seller.id}`).set("Cookie", visitor);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain(seller.email);
  });
});

describe("a paid lesson's file address is only given to people who may watch it", () => {
  it("course page (logged out): the lesson is listed, its url is not", async () => {
    const res = await request(app).get(`/api/courses/${course.id}/public`);
    const lesson = res.body.course.lessons.find((l) => l.id === course.videoId);
    expect(lesson).toBeDefined();
    expect(lesson.url).toBeNull();
    expect(res.text).not.toContain("/uploads/");
  });

  it("watch page for a student who isn't enrolled -> 403, no urls", async () => {
    const stranger = await login(await makeUser("user"));
    const res = await request(app).get(`/api/courses/${course.id}/watch`).set("Cookie", stranger);
    expect(res.status).toBe(403);
    expect(res.text).not.toContain("/uploads/");
  });
});

describe("no answer ever contains a password hash", () => {
  it("register, login and /me", async () => {
    const email = `leak-check-${Date.now()}@lumen.test`;
    const answers = [
      await request(app).post("/api/auth/register").send({ email, password: "Abcd1!xy", role: "user" }),
      await request(app).post("/api/auth/login").send({ email: seller.email, password: PASSWORD }),
      await request(app).get("/api/auth/me").set("Cookie", sellerCookie),
      await request(app).get("/api/profile").set("Cookie", sellerCookie),
    ];
    for (const res of answers) {
      expect(res.status).toBeLessThan(300);
      expect(res.text).not.toContain(BCRYPT_PREFIX);
    }
  });
});
