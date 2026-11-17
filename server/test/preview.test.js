// Free preview lessons (is_preview): the seller chooses them in the course editor. A preview lesson's file is open to
// anyone (the course page plays it); every other lesson's file stays behind protectVideos.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { VIDEO, login, makeUser, resetTables } from "./helpers.js";

const lesson = (title, isPreview) => JSON.stringify({ title, description: "", duration: 30, ...(isPreview === undefined ? {} : { is_preview: isPreview }) });
const lessonsOf = async (courseId) =>
  (await db.query("SELECT id, title, url, is_preview FROM course_media WHERE course_id = ? AND type = 'video' ORDER BY order_index", [courseId]))[0];

let seller, course;
beforeAll(async () => {
  await resetTables();
  seller = await login(await makeUser("seller"));
  const res = await request(app)
    .post("/api/courses")
    .set("Cookie", seller)
    .field("title", "Preview course")
    .field("description", "d")
    .field("price", "20")
    .field("meta[]", lesson("Free intro", true))
    .attach("videos", VIDEO, { filename: "a.mp4", contentType: "video/mp4" })
    .field("meta[]", lesson("Paid lesson", false))
    .attach("videos", VIDEO, { filename: "b.mp4", contentType: "video/mp4" })
    .field("meta[]", lesson("Not chosen", undefined))
    .attach("videos", VIDEO, { filename: "c.mp4", contentType: "video/mp4" });
  expect(res.status).toBe(201);
  course = res.body.course;
});

describe("saving the choice", () => {
  it("new lessons keep their preview choice; no choice means not a preview", async () => {
    expect((await lessonsOf(course.id)).map((l) => [l.title, l.is_preview])).toEqual([
      ["Free intro", 1],
      ["Paid lesson", 0],
      ["Not chosen", 0],
    ]);
  });

  it("editing a saved lesson can switch it on and off", async () => {
    const [intro, paid] = await lessonsOf(course.id);
    const edit = (changes) => {
      let req = request(app).put(`/api/courses/${course.id}`).set("Cookie", seller)
        .field("title", "Preview course").field("description", "d").field("price", "20");
      for (const c of changes) req = req.field("existingVideos[]", JSON.stringify({ title: c.title, description: "", duration: 30, ...c }));
      return req;
    };
    expect((await edit([{ id: paid.id, title: "Paid lesson", is_preview: true }])).status).toBe(200);
    expect((await lessonsOf(course.id))[1].is_preview).toBe(1);
    expect((await edit([{ id: paid.id, title: "Paid lesson", is_preview: false }, { id: intro.id, title: "Free intro" }])).status).toBe(200);
    const [introAfter, paidAfter] = await lessonsOf(course.id);
    expect(paidAfter.is_preview).toBe(0);
    expect(introAfter.is_preview).toBe(1); // an edit that doesn't mention is_preview leaves it as it was
  });

  it("is_preview that isn't true/false -> 400", async () => {
    const res = await request(app).post("/api/courses").set("Cookie", seller)
      .field("title", "T").field("description", "d").field("price", "0")
      .field("meta[]", lesson("L", "maybe"))
      .attach("videos", VIDEO, { filename: "x.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(400);
  });

  it("the seller's course list and the course answer carry is_preview (the editor shows the checkbox state)", async () => {
    const list = await request(app).get("/api/courses").set("Cookie", seller);
    const own = list.body.find((c) => c.id === course.id);
    expect(own.videos.find((v) => v.title === "Free intro").is_preview).toBe(1);
  });
});

describe("who can load which file", () => {
  it("logged out: the preview lesson's file plays, a paid lesson's file doesn't", async () => {
    const [intro, paid] = await lessonsOf(course.id);
    expect((await request(app).get(intro.url)).status).toBe(200);
    expect([401, 403]).toContain((await request(app).get(paid.url)).status);
  });

  it("the public course page gives the url of preview lessons only", async () => {
    const res = await request(app).get(`/api/courses/${course.id}/public`);
    const byTitle = Object.fromEntries(res.body.course.lessons.map((l) => [l.title, l.url]));
    expect(byTitle["Free intro"]).toMatch(/^\/uploads\//);
    expect(byTitle["Paid lesson"]).toBeNull();
    expect(byTitle["Not chosen"]).toBeNull();
  });
});
