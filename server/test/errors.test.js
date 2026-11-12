// What leaves the server when something goes wrong: the answer to the client, and the log line.
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import { logError } from "../lib/logError.js";
import { resetTables } from "./helpers.js";

const STACK_HINTS = ["node_modules", "    at ", "<pre>", "Utente_GALOIS"];
const expectNoInternals = (res) => {
  expect(res.headers["content-type"]).toMatch(/application\/json/);
  for (const hint of STACK_HINTS) expect(res.text).not.toContain(hint);
};

beforeAll(resetTables);
afterEach(() => vi.restoreAllMocks());

describe("error answers are short JSON, never a stack trace (whatever NODE_ENV is)", () => {
  it("malformed JSON body -> 400", async () => {
    const res = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send('{"email": ');
    expect(res.status).toBe(400);
    expectNoInternals(res);
  });

  it("body over the JSON limit -> 413", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@lumen.test", password: "x".repeat(200_000) });
    expect(res.status).toBe(413);
    expectNoInternals(res);
  });

  it("unknown route -> 404 JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expectNoInternals(res);
  });
});

describe("logError never writes the values inside a database error", () => {
  it("a real failed INSERT: no hash, no email, no SQL in the log; the error code stays", async () => {
    // A duplicate email fails in every SQL mode (a too-long one is silently cut short in loose mode), and MySQL's
    // message quotes the value: "Duplicate entry '<email>' for key ...". So both err.sql and err.message carry data.
    const email = `dup-${Date.now()}@lumen.test`;
    const secretHash = "$2b$10$THIS-IS-A-SECRET-HASH";
    const insert = () => db.query("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')", [email, secretHash]);
    await insert();
    const err = await insert().catch((e) => e);
    expect(err.code).toBe("ER_DUP_ENTRY");
    expect(err.sql).toContain(secretHash); // the raw error really does carry the values
    expect(err.message).toContain(email);

    const lines = [];
    vi.spyOn(console, "error").mockImplementation((...args) => lines.push(args.join(" ")));
    logError("Register", err);

    const logged = lines.join("\n");
    expect(logged).not.toContain(secretHash);
    expect(logged).not.toContain(email);
    expect(logged).not.toContain("INSERT INTO");
    expect(logged).toContain("ER_DUP_ENTRY");
    expect(logged).toContain("Register");
  });

  it("an ordinary bug keeps its message, so it can still be debugged", () => {
    const lines = [];
    vi.spyOn(console, "error").mockImplementation((...args) => lines.push(args.join(" ")));
    logError("Watch course", new TypeError("Cannot read properties of undefined (reading 'id')"));
    expect(lines.join("\n")).toContain("Cannot read properties of undefined");
  });
});
