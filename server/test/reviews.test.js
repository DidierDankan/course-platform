// Stage 4: course reviews. Threat: anyone inflating a course with ratings. Only enrolled students (never the course's
// owner) may review, once per course, and every average is computed by the server from the reviews table.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import UserService from "../db/UserService.js";
import { enroll, login, makeCourse, makeUser, resetTables } from "./helpers.js";

const review = (cookie, courseId, body) => request(app).put(`/api/courses/${courseId}/reviews`).set("Cookie", cookie).send(body);
const reviewsOf = (courseId, query = "") => request(app).get(`/api/courses/${courseId}/reviews${query}`);
const named = async (role, fullName) => {
  const user = await makeUser(role);
  if (fullName) await UserService.updateUserProfile(user.id, { full_name: fullName });
  return { ...user, cookie: await login(user) };
};
// A student enrolled in each given (free) course.
const enrolledStudent = async (courses, fullName) => {
  const student = await named("user", fullName);
  for (const course of courses) await enroll(student.cookie, course.id);
  return student;
};

let seller, course, other, sam;
beforeAll(async () => {
  await resetTables();
  seller = await named("seller", "Maya Chen");
  course = await makeCourse(seller.cookie);
  other = await makeCourse(seller.cookie);
  sam = await enrolledStudent([course], "Sam Rivera");
});

describe("who may review", () => {
  it("logged out -> 401", async () => {
    expect((await request(app).put(`/api/courses/${course.id}/reviews`).send({ rating: 5 })).status).toBe(401);
  });

  it("a student who isn't enrolled -> 403", async () => {
    const stranger = await named("user");
    expect((await review(stranger.cookie, course.id, { rating: 5 })).status).toBe(403);
  });

  it("the course's own seller -> 403, even with an enrollment row (no reviewing yourself)", async () => {
    // The app never enrolls an owner, so without this row the enrollment check would refuse first and the owner rule
    // would go untested. Plain SQL: there is no route that does this.
    await db.query("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [seller.id, course.id]);
    expect((await review(seller.cookie, course.id, { rating: 5 })).status).toBe(403);
    await db.query("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", [seller.id, course.id]);
  });

  it("a course that doesn't exist -> 404; an id that isn't a number -> 400", async () => {
    expect((await review(sam.cookie, 99999999, { rating: 5 })).status).toBe(404);
    expect((await review(sam.cookie, "abc", { rating: 5 })).status).toBe(400);
  });

  it("an enrolled student -> 201, then a second review updates the first instead of adding one", async () => {
    const first = await review(sam.cookie, course.id, { rating: 4, body: "Good start" });
    expect(first.status).toBe(201);
    const second = await review(sam.cookie, course.id, { rating: 5, body: "Even better on a second watch" });
    expect(second.status).toBe(200);

    const [rows] = await db.query("SELECT rating, body FROM reviews WHERE user_id = ? AND course_id = ?", [sam.id, course.id]);
    expect(rows).toEqual([{ rating: 5, body: "Even better on a second watch" }]);
  });
});

describe("bad input -> 400", () => {
  it.each([
    ["rating 0", { rating: 0 }],
    ["rating 6", { rating: 6 }],
    ["rating 2.5", { rating: 2.5 }],
    ["rating as text", { rating: "abc" }],
    ["rating as a list", { rating: [5, 5] }],
    ["no rating", { body: "nice" }],
    ["body over 1000 characters", { rating: 5, body: "x".repeat(1001) }],
    ["body as an object", { rating: 5, body: { a: 1 } }],
  ])("%s", async (_, body) => {
    expect((await review(sam.cookie, course.id, body)).status).toBe(400);
  });

  it("the database refuses a rating of 6 too (CHECK), whatever the code does", async () => {
    const insert = db.query("INSERT INTO reviews (course_id, user_id, rating) VALUES (?, ?, 6)", [other.id, sam.id]);
    await expect(insert).rejects.toMatchObject({ code: "ER_CHECK_CONSTRAINT_VIOLATED" });
  });
});

describe("reading reviews (public)", () => {
  it("newest first, the author as first name + last initial, never an email", async () => {
    const res = await reviewsOf(course.id);
    expect(res.status).toBe(200);
    expect(res.body.reviews[0]).toMatchObject({ rating: 5, body: "Even better on a second watch", author: "Sam R." });
    expect(res.text).not.toContain(sam.email);
    expect(res.text).not.toContain("Rivera");
  });

  it("an author without a profile name is shown as 'Student'", async () => {
    const anon = await enrolledStudent([other]);
    await review(anon.cookie, other.id, { rating: 3 });
    const res = await reviewsOf(other.id);
    expect(res.body.reviews.find((r) => r.rating === 3).author).toBe("Student");
  });

  it("paginates: each page holds at most `limit`, no review twice", async () => {
    const paged = await makeCourse(seller.cookie);
    for (let i = 0; i < 5; i += 1) {
      const student = await enrolledStudent([paged]);
      await review(student.cookie, paged.id, { rating: 1 + (i % 5) });
    }
    const page1 = (await reviewsOf(paged.id, "?limit=2&page=1")).body;
    const page2 = (await reviewsOf(paged.id, "?limit=2&page=2")).body;
    const page3 = (await reviewsOf(paged.id, "?limit=2&page=3")).body;
    const ids = [...page1.reviews, ...page2.reviews, ...page3.reviews].map((r) => r.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect([page1.hasMore, page2.hasMore, page3.hasMore]).toEqual([true, true, false]);
    expect(page1.summary).toEqual({ average: 3, count: 5 });
  });

  it("a course without reviews -> an empty list and { average: null, count: 0 }", async () => {
    const empty = await makeCourse(seller.cookie);
    const res = await reviewsOf(empty.id);
    expect(res.body).toMatchObject({ reviews: [], hasMore: false, summary: { average: null, count: 0 } });
  });

  it("the signed-in student can read their own review (to fill the form)", async () => {
    const res = await request(app).get(`/api/courses/${course.id}/reviews/mine`).set("Cookie", sam.cookie);
    expect(res.status).toBe(200);
    expect(res.body.review).toMatchObject({ rating: 5 });
  });
});

describe("averages on lists and pages", () => {
  let rated;
  beforeAll(async () => {
    // 4 reviews: 5, 4, 4, 2 -> average 3.75. Two lessons' worth of duration stays as it was.
    rated = await makeCourse(seller.cookie);
    for (const rating of [5, 4, 4, 2]) {
      const student = await enrolledStudent([rated]);
      await review(student.cookie, rated.id, { rating });
    }
  });

  it("the course list carries rating_avg and rating_count, and total_duration isn't multiplied by the reviews", async () => {
    const res = await request(app).get(`/api/courses/all?sellerId=${seller.id}&limit=50`);
    const row = res.body.find((c) => c.id === rated.id);
    expect(row).toMatchObject({ rating_avg: 3.75, rating_count: 4 });
    expect(Number(row.total_duration)).toBe(60); // one 60 s lesson, not 4 x 60
  });

  it("the course page carries them too", async () => {
    const res = await request(app).get(`/api/courses/${rated.id}/public`);
    expect(res.body.course).toMatchObject({ rating_avg: 3.75, rating_count: 4 });
  });

  it("the seller average is over ALL their reviews, not an average of course averages", async () => {
    const res = await request(app).get(`/api/public/sellers/${seller.id}`);
    const [[{ avg, n }]] = await db.query(
      "SELECT AVG(r.rating) AS avg, COUNT(*) AS n FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.seller_id = ?",
      [seller.id]
    );
    expect(res.body.seller).toMatchObject({ rating_avg: Math.round(Number(avg) * 100) / 100, rating_count: Number(n) });
  });

  it("a review can be deleted by its author: 200, then 404", async () => {
    const student = await enrolledStudent([rated]);
    await review(student.cookie, rated.id, { rating: 1 });
    const del = () => request(app).delete(`/api/courses/${rated.id}/reviews`).set("Cookie", student.cookie);
    expect((await del()).status).toBe(200);
    expect((await del()).status).toBe(404);
  });
});

describe("sort=top_rated", () => {
  it("one 5-star review doesn't outrank ten 4-star reviews (damped score), and pages repeat or skip nothing", async () => {
    const topSeller = await named("seller");
    const lucky = await makeCourse(topSeller.cookie); // 1 x 5 -> (5 + 17.5) / 6 = 3.75
    const solid = await makeCourse(topSeller.cookie); // 10 x 4 -> (40 + 17.5) / 15 = 3.83
    await makeCourse(topSeller.cookie); // no reviews -> 3.5, last
    await review((await enrolledStudent([lucky])).cookie, lucky.id, { rating: 5 });
    for (let i = 0; i < 10; i += 1) await review((await enrolledStudent([solid])).cookie, solid.id, { rating: 4 });

    const list = (page) => request(app).get(`/api/courses/all?sellerId=${topSeller.id}&sort=top_rated&limit=2&page=${page}`);
    const ids = [...(await list(1)).body, ...(await list(2)).body].map((c) => c.id);
    expect(ids.slice(0, 2)).toEqual([solid.id, lucky.id]);
    expect(new Set(ids).size).toBe(3);
  });
});
