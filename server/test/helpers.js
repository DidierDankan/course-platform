import request from "supertest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { assertTestDatabase } from "./guard.js";
import UserService from "../db/UserService.js";

export const PASSWORD = "Test-pass1!"; // only ever used for throwaway users in lumen_test

let counter = 0;

// Users go in with SQL, not POST /register: register allows 5 attempts an hour per IP.
export async function makeUser(role = "user") {
  counter += 1;
  return UserService.createUser({ email: `${role}-${Date.now()}-${counter}@lumen.test`, password: PASSWORD, role });
}

// Logs in through the real route and returns the cookies to send with later requests.
// A successful login doesn't count toward the login limit.
export async function login(user) {
  const res = await request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${user.email}: ${res.status}`);
  return res.headers["set-cookie"].map((cookie) => cookie.split(";")[0]).join("; ");
}

// A tiny MP4 header: enough for multer's file-type check (the server never decodes the video).
export const VIDEO = Buffer.from("00000018667479706d703432", "hex");

// A free course with one video lesson, through the real POST /api/courses (multer, validator, CourseService).
// Returns the course id and the lesson's media id, read back through the owner-only media route.
export async function makeCourse(sellerCookie) {
  const created = await request(app)
    .post("/api/courses")
    .set("Cookie", sellerCookie)
    .field("title", "Test course")
    .field("description", "Test description")
    .field("price", "0")
    .field("meta", JSON.stringify({ title: "Lesson 1", description: "d", duration: 60 }))
    .attach("videos", VIDEO, { filename: "lesson.mp4", contentType: "video/mp4" });
  if (created.status !== 201) throw new Error(`makeCourse failed: ${created.status} ${JSON.stringify(created.body)}`);

  const courseId = created.body.course.id;
  const media = await request(app).get(`/api/courses/${courseId}/media`).set("Cookie", sellerCookie);
  if (media.status !== 200) throw new Error(`makeCourse could not read media: ${media.status}`);
  return { id: courseId, videoId: media.body.find((item) => item.type === "video").id };
}

// Enrolls through the real free-enrollment route, so it only works for free courses (paid ones go through the webhook).
export async function enroll(studentCookie, courseId) {
  const res = await request(app).post("/api/enrollments").set("Cookie", studentCookie).send({ course_id: courseId });
  if (res.status !== 201) throw new Error(`enroll failed: ${res.status} ${JSON.stringify(res.body)}`);
}

// Empties every table except schema_migrations. Foreign key checks are off only on this one connection.
export async function resetTables() {
  assertTestDatabase();
  const [tables] = await db.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name <> 'schema_migrations'"
  );
  const conn = await db.getConnection();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const { name } of tables) await conn.query("TRUNCATE TABLE ??", [name]);
  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    conn.release();
  }
}
