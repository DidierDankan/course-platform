// The student's "My courses" list (GET /api/enrollments). Found 2026-11-21 on the live site: it answered 500 on TiDB
// (GROUP BY e.course_id, which MySQL accepts and TiDB refuses), and no test called the route.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

let first, second, student, otherStudent;
beforeAll(async () => {
  await resetTables();
  const sellerCookie = await login(await makeUser("seller"));
  first = await makeCourse(sellerCookie);
  second = await makeCourse(sellerCookie);
  student = await makeUser("user");
  student.cookie = await login(student);
  otherStudent = await makeUser("user");
  otherStudent.cookie = await login(otherStudent);
  await enroll(student.cookie, first.id);
  await enroll(student.cookie, second.id);
  await enroll(otherStudent.cookie, first.id);
});

describe("GET /api/enrollments", () => {
  it("lists the caller's courses, one row each, with the lesson time added up", async () => {
    const res = await request(app).get("/api/enrollments").set("Cookie", student.cookie);
    expect(res.status).toBe(200);
    expect(res.body.enrollments.map((row) => row.course_id).sort()).toEqual([first.id, second.id].sort());
    for (const row of res.body.enrollments) expect(Number(row.total_duration)).toBe(60); // one 60 s lesson each
  });

  it("only the caller's: another student sees their one course", async () => {
    const res = await request(app).get("/api/enrollments").set("Cookie", otherStudent.cookie);
    expect(res.status).toBe(200);
    expect(res.body.enrollments.map((row) => row.course_id)).toEqual([first.id]);
  });

  it("signed out -> 401", async () => {
    expect((await request(app).get("/api/enrollments")).status).toBe(401);
  });
});
