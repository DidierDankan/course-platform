// Register and login input. Its own file because the register limit counts every attempt (5 an hour per address)
// and each test file gets its own copy of the app, so these cases can't use up another file's attempts.
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { PASSWORD, makeUser, resetTables } from "./helpers.js";

const register = (body) => request(app).post("/api/auth/register").send(body);
const login = (body) => request(app).post("/api/auth/login").send(body);
// 72 bytes: what bcrypt reads. Contains a number and a special character, like every valid password here.
const PASSWORD_72_BYTES = `1!${"a".repeat(70)}`;

let user;
beforeAll(async () => {
  await resetTables();
  user = await makeUser("user");
});

describe("register (5 attempts: the whole hourly limit)", () => {
  it("CONTROL: a 72-byte password is accepted", async () => {
    const res = await register({ email: "long-pass@lumen.test", password: PASSWORD_72_BYTES, role: "user" });
    expect(res.status).toBe(201);
  });

  it("a 73-byte password -> 400 (bcrypt would silently ignore the last byte)", async () => {
    const res = await register({ email: "too-long@lumen.test", password: `${PASSWORD_72_BYTES}b`, role: "user" });
    expect(res.status).toBe(400);
  });

  it("a 72-character password with an emoji is over 72 bytes -> 400", async () => {
    const res = await register({ email: "emoji@lumen.test", password: `1!${"a".repeat(69)}😀`, role: "user" });
    expect(res.status).toBe(400);
  });

  it("email sent as a list -> 400 (isEmail alone checks each item)", async () => {
    const res = await register({ email: ["a@lumen.test", "b@lumen.test"], password: "Abcd1!xy", role: "user" });
    expect(res.status).toBe(400);
  });

  it("role sent as a list -> 400 (was a 500 from role.toLowerCase)", async () => {
    const res = await register({ email: "role-list@lumen.test", password: "Abcd1!xy", role: ["user"] });
    expect(res.status).toBe(400);
  });
});

describe("login", () => {
  it("CONTROL: the right password signs in", async () => {
    expect((await login({ email: user.email, password: PASSWORD })).status).toBe(200);
  });

  it("email sent as a list -> 400", async () => {
    expect((await login({ email: [user.email], password: PASSWORD })).status).toBe(400);
  });

  it("password sent as an object -> 400 (bcrypt.compare would throw: a 500)", async () => {
    expect((await login({ email: user.email, password: { a: 1 } })).status).toBe(400);
  });

  it("email with spaces around it still signs in (trimmed)", async () => {
    expect((await login({ email: `  ${user.email}  `, password: PASSWORD })).status).toBe(200);
  });
});
