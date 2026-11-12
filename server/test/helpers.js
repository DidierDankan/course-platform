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
