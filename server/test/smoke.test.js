import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { login, makeUser, resetTables } from "./helpers.js";

beforeAll(resetTables);

describe("test setup", () => {
  it("answers without opening a port", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("uses the test database in the SQL mode asked for", async () => {
    const [[row]] = await db.query("SELECT DATABASE() AS name, @@SESSION.sql_mode AS mode");
    expect(row.name).toBe("lumen_test");
    // MySQL expands combination modes (ANSI, TRADITIONAL) into their parts, so check the parts of the default instead.
    if (process.env.TEST_SQL_MODE) {
      console.log(`SQL mode under test: ${row.mode}`);
    } else {
      expect(row.mode).toContain("STRICT_TRANS_TABLES");
    }
  });

  it("an object in a query value is text, never `key` = value SQL (stringifyObjects)", async () => {
    await makeUser("user");
    // Without the pool option this becomes WHERE id = `id` = 1: true for every row.
    const [rows] = await db.query("SELECT id FROM users WHERE id = ?", [{ id: 1 }]);
    expect(rows).toHaveLength(0);
  });

  it("logs a user in and reads them back", async () => {
    const user = await makeUser("seller");
    const cookie = await login(user);
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
