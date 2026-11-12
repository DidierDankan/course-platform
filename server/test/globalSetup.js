// Runs once before all test files: rebuilds lumen_test with the real migration runner,
// so the test database always matches the schema and npm run migrate is tested too.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import config from "../config.js";
import { assertTestDatabase } from "./guard.js";

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default async function setup() {
  assertTestDatabase();
  const { host, port, user, password, name } = config.db;
  const conn = await mysql.createConnection({ host, port, user, password });
  try {
    await conn.query("DROP DATABASE IF EXISTS ??", [name]); // ?? = identifier placeholder
    await conn.query("CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", [name]);
  } finally {
    await conn.end();
  }
  const migrate = spawnSync(process.execPath, ["scripts/migrate.js"], { cwd: SERVER_DIR, env: process.env, encoding: "utf8" });
  if (migrate.status !== 0) throw new Error(`migrate failed on ${name}:\n${migrate.stdout}${migrate.stderr}`);
}
