// Stage 2b: bad input must answer 4xx, never 500, under MySQL's strict mode (set in vitest.config.js).
// A case with knownBug runs as it.fails: it passes while the server is still wrong, and turns red once the fix lands.
// So the change that fixes a bug must also delete its knownBug line.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
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
  ctx = { sellerId: seller.id, sellerCookie, studentCookie, courseId: course.id, videoId: course.videoId };
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
    { name: "lesson duration is text", want: [400], knownBug: "2b step 4", send: () => createCourse({ lesson: { title: "T", duration: "abc" } }) },
    { name: "lesson title 300 characters", want: [400], knownBug: "2b step 4", send: () => createCourse({ lesson: { title: x(300) } }) },
    { name: "description 70,000 characters", want: [400], knownBug: "2b step 4", send: () => createCourse({ description: TOO_BIG_FOR_TEXT }) },
    { name: "list: duration filter is text", want: [400], knownBug: "2b step 4", send: () => request(app).get("/api/courses/all?minDuration=abc&maxDuration=def") },
    { name: "list: seller filter is text", want: [400], knownBug: "2b step 4", send: () => request(app).get("/api/courses/all?sellerId=abc") },
    { name: "public course: id is text", want: [400], send: () => request(app).get("/api/courses/abc/public") },
    { name: "seller page: id is text", want: [400, 404], send: () => request(app).get("/api/public/sellers/abc") },
  ]);
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
    { name: "progress: enormous position", want: [400], knownBug: "2b step 5", send: () => saveProgress({ lastWatchedMediaId: ctx.videoId, lastPositionSeconds: 1e12 }) },
    { name: "progress: lesson that doesn't exist", want: [404], knownBug: "2b step 5", send: () => saveProgress({ lastWatchedMediaId: MISSING_ID, lastPositionSeconds: 1 }) },
    { name: "favorite: course that doesn't exist", want: [404], knownBug: "2b step 5", send: () => request(app).post("/api/favorites").set("Cookie", ctx.studentCookie).send({ course_id: MISSING_ID }) },
    { name: "enroll: course that doesn't exist", want: [404], send: () => request(app).post("/api/enrollments").set("Cookie", ctx.studentCookie).send({ course_id: MISSING_ID }) },
  ]);
});

describe("auth: bad input -> 400", () => {
  runCases([
    { name: "register: email over 191 characters", want: [400], knownBug: "2b step 6", send: () => register(LONG_EMAIL) },
  ]);
});
