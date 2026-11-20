// robots.txt and sitemap.xml: crawlers get the public pages at the site's own address (CLIENT_URL), never the API,
// signed-in areas or the paid player, and the sitemap lists the courses and instructors that really exist.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import config from "../config.js";
import { login, makeCourse, makeUser, resetTables } from "./helpers.js";

const site = config.clientUrl.replace(/\/+$/, "");
const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

let seller, idleSeller, student, course;
beforeAll(async () => {
  await resetTables();
  seller = await makeUser("seller");
  idleSeller = await makeUser("seller");
  student = await makeUser("user");
  course = await makeCourse(await login(seller));
});

describe("robots.txt", () => {
  it("allows the site, keeps crawlers out of the API, signed-in pages and the player, and points to the sitemap", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^text\/plain/);
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");

    const lines = res.text.split("\n");
    expect(lines).toContain("User-agent: *");
    expect(lines).toContain("Allow: /");
    for (const path of ["/api/", "/profile/", "/user/", "/payment/", "/courses/*/watch"]) {
      expect(lines).toContain(`Disallow: ${path}`);
    }
    expect(lines).toContain(`Sitemap: ${site}/sitemap.xml`);
  });
});

describe("sitemap.xml", () => {
  it("lists the home page, Browse, every course and every instructor with a course, at the site's address", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^application\/xml/);
    expect(res.text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);

    expect(locs(res.text)).toEqual([`${site}/`, `${site}/courses`, `${site}/courses/${course.id}`, `${site}/sellers/${seller.id}`]);
  });

  it("leaves out instructors without courses and students (their pages have nothing to index)", async () => {
    const urls = locs((await request(app).get("/sitemap.xml")).text);
    expect(urls).not.toContain(`${site}/sellers/${idleSeller.id}`);
    expect(urls).not.toContain(`${site}/sellers/${student.id}`);
  });

  it("a deleted course disappears from it", async () => {
    const other = await makeCourse(await login(seller));
    expect(locs((await request(app).get("/sitemap.xml")).text)).toContain(`${site}/courses/${other.id}`);
    expect((await request(app).delete(`/api/courses/${other.id}`).set("Cookie", await login(seller))).status).toBe(200);
    expect(locs((await request(app).get("/sitemap.xml")).text)).not.toContain(`${site}/courses/${other.id}`);
  });
});
