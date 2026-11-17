// The Favorites page shows course cards like Browse: they need the instructor's name and the rating too.
// Found 2026-11-17 in a browser screenshot: every favorite said "By Instructor" and never showed stars.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import UserService from "../db/UserService.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

let seller, course, student;
beforeAll(async () => {
  await resetTables();
  seller = await makeUser("seller");
  await UserService.updateUserProfile(seller.id, { full_name: "Maya Chen" });
  course = await makeCourse(await login(seller));
  student = { ...(await makeUser("user")) };
  student.cookie = await login(student);
  await enroll(student.cookie, course.id);
  await request(app).put(`/api/courses/${course.id}/reviews`).set("Cookie", student.cookie).send({ rating: 4 });
  await request(app).post("/api/favorites").set("Cookie", student.cookie).send({ course_id: course.id });
});

describe("GET /api/favorites", () => {
  it("each favorite carries the instructor's name and the rating, like a Browse card", async () => {
    const res = await request(app).get("/api/favorites").set("Cookie", student.cookie);
    expect(res.status).toBe(200);
    expect(res.body.favorites).toHaveLength(1);
    expect(res.body.favorites[0]).toMatchObject({
      course_id: course.id,
      tutor_name: "Maya Chen",
      rating_avg: 4,
      rating_count: 1,
    });
    expect(Number(res.body.favorites[0].total_duration)).toBe(60); // not multiplied by the rating subqueries
  });

  it("never the instructor's email", async () => {
    const res = await request(app).get("/api/favorites").set("Cookie", student.cookie);
    expect(res.text).not.toContain(seller.email);
  });
});
