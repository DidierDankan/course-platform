// Runs inside every test file. Each file gets its own copy of the app and the pool, so each closes its own pool.
import { afterAll } from "vitest";
import db from "../db/connection.js";
import { assertTestDatabase } from "./guard.js";

assertTestDatabase();
afterAll(() => db.end());
