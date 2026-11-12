// Stage 2b: bad input must answer 4xx, never 500, under MySQL's strict mode (set in vitest.config.js).
// A case with knownBug runs as it.fails: it passes while the server is still wrong, and turns red once the fix lands.
// So the change that fixes a bug must also delete its knownBug line.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { VIDEO, enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const x = (length, char = "x") => char.repeat(length);
const TOO_BIG_FOR_TEXT = x(70_000); // a TEXT column holds 65,535 bytes
const MISSING_ID = 99_999_999;
const LONG_EMAIL = `${x(64, "a")}@${x(60, "b")}.${x(60, "c")}.${x(30, "d")}.test`; // over users.email's 191

let ctx;
beforeAll(async () => {
  await resetTables();
  const seller = await makeUser("seller");
  const student = await makeUser("user");
  const sellerCookie = await login(seller);
  const studentCookie = await login(student);
  const course = await makeCourse(sellerCookie);
  await enroll(studentCookie, course.id);
  ctx = { sellerId: seller.id, studentId: student.id, sellerCookie, studentCookie, courseId: course.id, videoId: course.videoId };
});

// Request builders. They read ctx when a test runs, after beforeAll has filled it.
const editProfile = (fields) => request(app).patch("/api/profile/edit").set("Cookie", ctx.studentCookie).send(fields);
const saveProgress = (fields) =>
  request(app).patch(`/api/enrollments/${ctx.courseId}`).set("Cookie", ctx.studentCookie).send(fields);
const createCourse = ({ description = "d", lesson } = {}) => {
  const req = request(app)
    .post("/api/courses")
    .set("Cookie", ctx.sellerCookie)
    .field("title", "Case course")
    .field("description", description)
    .field("price", "0");
  if (!lesson) return req;
  return req.field("meta", JSON.stringify(lesson)).attach("videos", VIDEO, { filename: "lesson.mp4", contentType: "video/mp4" });
};
const register = (email) => request(app).post("/api/auth/register").send({ email, password: "Abcd1!xy", role: "user" });

function runCases(cases) {
  for (const { name, want, send, knownBug } of cases) {
    const test = knownBug ? it.fails : it;
    test(knownBug ? `${name} [known bug, fixed in ${knownBug}]` : name, async () => {
      const res = await send();
      expect(want, `answered ${res.status}: ${JSON.stringify(res.body)}`).toContain(res.status);
    });
  }
}

describe("valid requests keep working", () => {
  runCases([
    { name: "profile: valid edit", want: [200], send: () => editProfile({
        full_name: "Test Student", phone: "+15551234567", website: "https://example.test", bio: "b",
        skills: JSON.stringify(["SQL"]),
        qualifications: JSON.stringify([{ title: "Cert", institution: "Uni", issued_at: "2024-01-15" }]),
      }) },
    { name: "profile: empty lists", want: [200], send: () => editProfile({ skills: "[]", qualifications: "[]" }) },
    { name: "profile: same skill twice, other case", want: [200], send: () => editProfile({ skills: JSON.stringify(["SQL", "sql ", "Node"]) }) },
    { name: "profile: same qualification twice", want: [200], send: () => editProfile({
        qualifications: JSON.stringify([{ title: "Cert", institution: "Uni" }, { title: "cert", institution: "uni" }]),
      }) },
    { name: "progress: valid", want: [200], send: () => saveProgress({ lastWatchedMediaId: ctx.videoId, lastPositionSeconds: 12.5, completed: false }) },
    { name: "course: create with a lesson", want: [201], send: () => createCourse({ lesson: { title: "Lesson", description: "d", duration: 60 } }) },
    { name: "list: every filter", want: [200], send: () => request(app).get(
        `/api/courses/all?q=a&minPrice=0&maxPrice=999&minDuration=0&maxDuration=99999&sellerId=${ctx.sellerId}&sort=popular&limit=2&offset=0`) },
    { name: "public course", want: [200], send: () => request(app).get(`/api/courses/${ctx.courseId}/public`) },
    { name: "favorite: existing course", want: [200, 201], send: () => request(app).post("/api/favorites").set("Cookie", ctx.studentCookie).send({ course_id: ctx.courseId }) },
    { name: "register: normal email", want: [201], send: () => register(`new-${Date.now()}@lumen.test`) },
  ]);
});

describe("profile: bad input -> 400", () => {
  runCases([
    { name: "name 300 characters", want: [400], send: () => editProfile({ full_name: x(300) }) },
    { name: "phone 30 characters", want: [400], send: () => editProfile({ phone: x(30, "1") }) },
    { name: "website 300 characters", want: [400], send: () => editProfile({ website: `https://${x(300)}.test` }) },
    { name: "website is not a web address", want: [400], send: () => editProfile({ website: "javascript:alert(1)" }) },
    { name: "bio 70,000 characters", want: [400], send: () => editProfile({ bio: TOO_BIG_FOR_TEXT }) },
    { name: "skills is not a list", want: [400], send: () => editProfile({ skills: "{not json" }) },
    { name: "skill 150 characters", want: [400], send: () => editProfile({ skills: JSON.stringify([x(150)]) }) },
    { name: "empty skill", want: [400], send: () => editProfile({ skills: JSON.stringify([null]) }) },
    { name: "qualification title 150 characters", want: [400], send: () => editProfile({ qualifications: JSON.stringify([{ title: x(150), institution: "I" }]) }) },
    { name: "qualification without a title", want: [400], send: () => editProfile({ qualifications: JSON.stringify([{ institution: "I" }]) }) },
    { name: "qualification with a bad date", want: [400], send: () => editProfile({ qualifications: JSON.stringify([{ title: "T", institution: "I", issued_at: "not-a-date" }]) }) },
  ]);
});

describe("courses and lists: bad input -> 400 (or 404 for an id)", () => {
  runCases([
    { name: "lesson duration is text", want: [400], send: () => createCourse({ lesson: { title: "T", duration: "abc" } }) },
    { name: "lesson title 300 characters", want: [400], send: () => createCourse({ lesson: { title: x(300) } }) },
    { name: "description 70,000 characters", want: [400], send: () => createCourse({ description: TOO_BIG_FOR_TEXT }) },
    { name: "public course: id is text", want: [400], send: () => request(app).get("/api/courses/abc/public") },
    { name: "seller page: id is text", want: [400, 404], send: () => request(app).get("/api/public/sellers/abc") },
  ]);
});

// Rule (owner's decision 2026-11-12): filters that only narrow the list are ignored when invalid, like price, so a stale
// or hand-edited shared link still shows a list; an id (sellerId) must be valid, or the answer is 400.
describe("course list filters", () => {
  const list = (query) => request(app).get(`/api/courses/all?${query}`);
  runCases([
    { name: "duration filter is text -> ignored", want: [200], send: () => list("minDuration=abc&maxDuration=def") },
    { name: "duration filter is negative -> ignored", want: [200], send: () => list("maxDuration=-1") },
    { name: "sellerId is text -> 400", want: [400], send: () => list("sellerId=abc") },
    { name: "sellerId is 0 -> 400", want: [400], send: () => list("sellerId=0") },
    { name: "sellerId sent twice -> 400", want: [400], send: () => list("sellerId=1&sellerId=2") },
    { name: "page far past the end -> empty list, not an SQL error", want: [200], send: () => list("page=99999999999999999999") },
    { name: "sort=__proto__ -> default order, not [object Object] in the SQL", want: [200], send: () => list("sort=__proto__") },
    { name: "sort=constructor -> default order", want: [200], send: () => list("sort=constructor") },
  ]);
});

describe("course and lesson fields: bad input -> 400", () => {
  const lessonForm = (req, field, values) => values.reduce((r, value) => r.field(field, value), req);
  const createWith = (meta) =>
    lessonForm(
      request(app).post("/api/courses").set("Cookie", ctx.sellerCookie).field("title", "T").field("description", "d").field("price", "0"),
      "meta[]",
      meta
    ).attach("videos", VIDEO, { filename: "lesson.mp4", contentType: "video/mp4" });
  const editWith = (fields) => {
    let req = request(app).put(`/api/courses/${ctx.courseId}`).set("Cookie", ctx.sellerCookie)
      .field("title", "Test course").field("description", "Test description").field("price", "0");
    for (const [field, values] of Object.entries(fields)) req = lessonForm(req, `${field}[]`, values);
    return req;
  };
  runCases([
    { name: "CONTROL: lesson with a decimal duration (what browsers send)", want: [201], send: () => createWith([JSON.stringify({ title: "L", description: "", duration: 12.345 })]) },
    { name: "CONTROL: edit a saved lesson", want: [200], send: () => editWith({ existingVideos: [JSON.stringify({ id: ctx.videoId, title: "Lesson 1", description: "", duration: 60 })] }) },
    { name: "new lesson is not JSON (was saved without its title)", want: [400], send: () => createWith(["{not json"]) },
    { name: "new lesson duration is negative", want: [400], send: () => createWith([JSON.stringify({ title: "L", duration: -5 })]) },
    { name: "new lesson duration larger than INT", want: [400], send: () => createWith([JSON.stringify({ title: "L", duration: 1e12 })]) },
    { name: "new lesson is a list, not an object", want: [400], send: () => createWith([JSON.stringify(["L"])]) },
    { name: "saved lesson title 300 characters", want: [400], send: () => editWith({ existingVideos: [JSON.stringify({ id: ctx.videoId, title: x(300) })] }) },
    { name: "saved lesson without its id", want: [400], send: () => editWith({ existingVideos: [JSON.stringify({ title: "L" })] }) },
    { name: "deleted lesson id is text", want: [400], send: () => editWith({ deletedVideos: ["abc"] }) },
    { name: "title sent twice", want: [400], send: () => request(app).post("/api/courses").set("Cookie", ctx.sellerCookie).field("title", "A").field("title", "B").field("description", "d").field("price", "0") },
    { name: "price sent twice", want: [400], send: () => request(app).post("/api/courses").set("Cookie", ctx.sellerCookie).field("title", "T").field("description", "d").field("price", "1").field("price", "2") },
  ]);
});

// Authorization, not validation, but found while reading the edit code: lesson ids in an edit are scoped to the course.
describe("a course edit only touches the seller's own lessons", () => {
  it("another seller's lesson ids in deletedVideos / existingVideos change nothing", async () => {
    const otherCookie = await login(await makeUser("seller"));
    const victim = await makeCourse(ctx.sellerCookie);
    const attackerCourse = await makeCourse(otherCookie);

    const res = await request(app).put(`/api/courses/${attackerCourse.id}`).set("Cookie", otherCookie)
      .field("title", "Mine").field("description", "d").field("price", "0")
      .field("existingVideos[]", JSON.stringify({ id: victim.videoId, title: "hijacked" }))
      .field("deletedVideos[]", String(victim.videoId));
    expect(res.status).toBe(200);

    const [rows] = await db.query("SELECT title FROM course_media WHERE id = ?", [victim.videoId]);
    expect(rows).toEqual([{ title: "Lesson 1" }]);
  });
});

describe("course ids: anything but a positive whole number -> 400, before any query", () => {
  const asSeller = (req) => req.set("Cookie", ctx.sellerCookie);
  runCases([
    { name: "public course: id is a decimal", want: [400], send: () => request(app).get("/api/courses/1.5/public") },
    { name: "public course: id is 0", want: [400], send: () => request(app).get("/api/courses/0/public") },
    { name: "public course: id larger than INT", want: [400], send: () => request(app).get("/api/courses/99999999999/public") },
    { name: "media list: id is text", want: [400], send: () => asSeller(request(app).get("/api/courses/abc/media")) },
    { name: "watch: id is text", want: [400], send: () => asSeller(request(app).get("/api/courses/abc/watch")) },
    { name: "edit course: id is text", want: [400], send: () => asSeller(request(app).put("/api/courses/abc")).field("title", "T").field("description", "d").field("price", "0") },
    { name: "delete course: id is text", want: [400], send: () => asSeller(request(app).delete("/api/courses/abc")) },
    { name: "delete lesson: id is text", want: [400], send: () => asSeller(request(app).delete("/api/courses/media/abc")) },
    { name: "a student editing with a text id still gets 403, not 400", want: [403], send: () => request(app).put("/api/courses/abc").set("Cookie", ctx.studentCookie) },
    { name: "CONTROL: owner reads the media list", want: [200], send: () => asSeller(request(app).get(`/api/courses/${ctx.courseId}/media`)) },
    { name: "CONTROL: owner deletes a real lesson", want: [200], send: async () => {
        const course = await makeCourse(ctx.sellerCookie); // its own course: the shared fixture's lesson is used by other tests
        return asSeller(request(app).delete(`/api/courses/media/${course.videoId}`));
      } },
  ]);
});

describe("progress, favorites, enrollments: bad input -> 400 / 404", () => {
  runCases([
    { name: "progress: enormous position", want: [400], send: () => saveProgress({ lastWatchedMediaId: ctx.videoId, lastPositionSeconds: 1e12 }) },
    { name: "progress: negative position", want: [400], send: () => saveProgress({ lastWatchedMediaId: ctx.videoId, lastPositionSeconds: -1 }) },
    { name: "progress: lesson that doesn't exist", want: [404], send: () => saveProgress({ lastWatchedMediaId: MISSING_ID, lastPositionSeconds: 1 }) },
    { name: "progress: lesson id sent as a list", want: [400], send: () => saveProgress({ lastWatchedMediaId: [ctx.videoId, ctx.videoId], lastPositionSeconds: 1 }) },
    { name: "progress: completed is not true/false", want: [400], send: () => saveProgress({ lastWatchedMediaId: ctx.videoId, completed: "maybe" }) },
    { name: "progress: course id is text", want: [400], send: () => request(app).patch("/api/enrollments/abc").set("Cookie", ctx.studentCookie).send({ lastPositionSeconds: 1 }) },
    { name: "favorite: course that doesn't exist", want: [404], send: () => request(app).post("/api/favorites").set("Cookie", ctx.studentCookie).send({ course_id: MISSING_ID }) },
    { name: "favorite: course_id is text", want: [400], send: () => request(app).post("/api/favorites").set("Cookie", ctx.studentCookie).send({ course_id: "abc" }) },
    { name: "favorite: check with a text id", want: [400], send: () => request(app).get("/api/favorites/abc").set("Cookie", ctx.studentCookie) },
    { name: "favorite: remove with a text id", want: [400], send: () => request(app).delete("/api/favorites/abc").set("Cookie", ctx.studentCookie) },
    { name: "enroll: course that doesn't exist", want: [404], send: () => request(app).post("/api/enrollments").set("Cookie", ctx.studentCookie).send({ course_id: MISSING_ID }) },
    { name: "enroll: course_id missing", want: [400], send: () => request(app).post("/api/enrollments").set("Cookie", ctx.studentCookie).send({}) },
    // mysql2 turns an object into SQL: WHERE id = ? with {"id": 1} becomes WHERE id = `id` = 1, which is true for every row
    { name: "enroll: course_id is an object", want: [400], send: () => request(app).post("/api/enrollments").set("Cookie", ctx.studentCookie).send({ course_id: { id: 1 } }) },
    { name: "checkout: course_id is text", want: [400], send: () => request(app).post("/api/payments/checkout").set("Cookie", ctx.studentCookie).send({ course_id: "abc" }) },
  ]);
});

// Found while reading updateProgress: the lesson id was never checked against the course in the URL.
describe("progress can only point at a lesson of the enrolled course", () => {
  it("a lesson of another course -> 404, and no progress row is written for it", async () => {
    const otherSeller = await login(await makeUser("seller"));
    const paidCourse = await makeCourse(otherSeller, { price: "19.99" }); // the student never bought this one
    const res = await saveProgress({ lastWatchedMediaId: paidCourse.videoId, lastPositionSeconds: 5, completed: true });
    expect(res.status).toBe(404);

    const [progress] = await db.query("SELECT id FROM lesson_progress WHERE course_media_id = ?", [paidCourse.videoId]);
    const [[enrollment]] = await db.query(
      "SELECT last_watched_media_id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [ctx.studentId, ctx.courseId]
    );
    expect(progress).toHaveLength(0);
    expect(enrollment.last_watched_media_id).not.toBe(paidCourse.videoId);
  });
});

describe("auth: bad input -> 400", () => {
  runCases([
    { name: "register: email over 191 characters", want: [400], send: () => register(LONG_EMAIL) },
  ]);
});
