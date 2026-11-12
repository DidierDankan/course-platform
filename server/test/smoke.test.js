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

  it("uses the test database in strict mode", async () => {
    const [[row]] = await db.query("SELECT DATABASE() AS name, @@SESSION.sql_mode AS mode");
    expect(row.name).toBe("lumen_test");
    expect(row.mode).toContain("STRICT_TRANS_TABLES");
  });

  it("logs a user in and reads them back", async () => {
    const user = await makeUser("seller");
    const cookie = await login(user);
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
