// Stage 4b: comments per course, an open discussion on the watch page.
// Threat: strangers posting on a course, or anyone deleting someone else's comment. Only enrolled students, the course's
// owner and admins may post; only the author, the course's owner or an admin may delete. Reading is public.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import UserService from "../db/UserService.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const post = (cookie, courseId, body) => request(app).post(`/api/courses/${courseId}/comments`).set("Cookie", cookie).send(body);
const list = (courseId, query = "", cookie) => {
  const req = request(app).get(`/api/courses/${courseId}/comments${query}`);
  return cookie ? req.set("Cookie", cookie) : req;
};
const remove = (cookie, commentId) => request(app).delete(`/api/courses/comments/${commentId}`).set("Cookie", cookie);
const person = async (role, fullName) => {
  const user = await makeUser(role);
  if (fullName) await UserService.updateUserProfile(user.id, { full_name: fullName });
  return { ...user, cookie: await login(user) };
};

let seller, course, sam, kim, stranger, admin;
beforeAll(async () => {
  await resetTables();
  seller = await person("seller", "Maya Chen");
  course = await makeCourse(seller.cookie);
  sam = await person("user", "Sam Rivera");
  kim = await person("user", "Kim Park");
  stranger = await person("user");
  admin = await person("admin");
  await enroll(sam.cookie, course.id);
  await enroll(kim.cookie, course.id);
});

describe("who may post", () => {
  it("logged out -> 401", async () => {
    expect((await request(app).post(`/api/courses/${course.id}/comments`).send({ body: "hi" })).status).toBe(401);
  });

  it("a user who isn't enrolled -> 403", async () => {
    expect((await post(stranger.cookie, course.id, { body: "Can I join?" })).status).toBe(403);
  });

  it("an enrolled student, the course's owner and an admin -> 201", async () => {
    expect((await post(sam.cookie, course.id, { body: "How long should the clay dry?" })).status).toBe(201);
    expect((await post(seller.cookie, course.id, { body: "About two days, covered loosely." })).status).toBe(201);
    expect((await post(admin.cookie, course.id, { body: "Pinned: please keep it on topic." })).status).toBe(201);
  });

  it("a course that doesn't exist -> 404; an id that isn't a number -> 400", async () => {
    expect((await post(sam.cookie, 99999999, { body: "hi" })).status).toBe(404);
    expect((await post(sam.cookie, "abc", { body: "hi" })).status).toBe(400);
  });
});

describe("bad input -> 400", () => {
  it.each([
    ["no body", {}],
    ["empty body", { body: "" }],
    ["only spaces", { body: "    " }],
    ["over 2000 characters", { body: "x".repeat(2001) }],
    ["an object", { body: { text: "hi" } }],
    ["a list", { body: ["hi", "there"] }],
  ])("%s", async (_, body) => {
    expect((await post(sam.cookie, course.id, body)).status).toBe(400);
  });
});

describe("reading (public)", () => {
  it("newest first; students as 'Sam R.', the owner by name with an instructor flag; no emails", async () => {
    const res = await list(course.id);
    expect(res.status).toBe(200);
    const [newest, answer, question] = res.body.comments;
    expect(newest.body).toBe("Pinned: please keep it on topic.");
    expect(answer).toMatchObject({ author: "Maya Chen", isInstructor: true });
    expect(question).toMatchObject({ author: "Sam R.", isInstructor: false, body: "How long should the clay dry?" });
    for (const p of [seller, sam, kim, admin]) expect(res.text).not.toContain(p.email);
    expect(res.text).not.toContain("Rivera");
  });

  it("text is returned as plain text, exactly as written (the client escapes it)", async () => {
    await post(kim.cookie, course.id, { body: '<img src=x onerror="alert(1)">' });
    const res = await list(course.id);
    expect(res.body.comments[0].body).toBe('<img src=x onerror="alert(1)">');
  });

  it("canDelete is true only for comments the viewer may delete", async () => {
    const asSam = (await list(course.id, "", sam.cookie)).body.comments;
    expect(asSam.filter((c) => c.canDelete).map((c) => c.author)).toEqual(["Sam R."]);
    const asOwner = (await list(course.id, "", seller.cookie)).body.comments;
    expect(asOwner.every((c) => c.canDelete)).toBe(true);
    const loggedOut = (await list(course.id)).body.comments;
    expect(loggedOut.some((c) => c.canDelete)).toBe(false);
  });

  it("paginates without repeating or skipping", async () => {
    const busy = await makeCourse(seller.cookie);
    await enroll(sam.cookie, busy.id);
    for (let i = 0; i < 5; i += 1) await post(sam.cookie, busy.id, { body: `Comment ${i}` });
    const pages = await Promise.all([1, 2, 3].map((p) => list(busy.id, `?limit=2&page=${p}`)));
    const ids = pages.flatMap((res) => res.body.comments.map((c) => c.id));
    expect(new Set(ids).size).toBe(5);
    expect(pages.map((res) => res.body.hasMore)).toEqual([true, true, false]);
  });

  it("an unknown course -> 404", async () => {
    expect((await list(99999999)).status).toBe(404);
  });
});

describe("who may delete", () => {
  const commentBy = async (author) => (await post(author.cookie, course.id, { body: "to be deleted" })).body.comment.id;

  it("another student -> 403, and the comment stays", async () => {
    const id = await commentBy(sam);
    expect((await remove(kim.cookie, id)).status).toBe(403);
    const [rows] = await db.query("SELECT id FROM comments WHERE id = ?", [id]);
    expect(rows).toHaveLength(1);
  });

  it("the author, the course's owner and an admin -> 200", async () => {
    for (const actor of [sam, seller, admin]) {
      const id = await commentBy(sam);
      expect((await remove(actor.cookie, id)).status).toBe(200);
      const [rows] = await db.query("SELECT id FROM comments WHERE id = ?", [id]);
      expect(rows).toHaveLength(0);
    }
  });

  it("a comment that doesn't exist -> 404; an id that isn't a number -> 400", async () => {
    expect((await remove(sam.cookie, 99999999)).status).toBe(404);
    expect((await remove(sam.cookie, "abc")).status).toBe(400);
  });
});
