// server/scripts/migrate.js
// Applies the new files in server/migrations in number order and records each one in schema_migrations,
// so every database gets the same changes exactly once.
//
//   npm run migrate
//
// MySQL can't undo table changes, so a file that fails halfway can leave its earlier statements applied.
// Keep each migration small; after a failure, check the database, fix the file and run this again.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { connectionOptions } from "../db/connection.js";
import { ScriptStop, SERVER_DIR, runScript } from "./lib.js";

const SCRIPT = "migrate";
const MIGRATIONS_DIR = path.join(SERVER_DIR, "migrations");
const MIGRATION_FILE = /^\d{3}_[a-z0-9_]+\.sql$/;
const LOCK_NAME = "lumen_migrate";
const LOCK_TIMEOUT_SECONDS = 30;

// One connection, because the lock belongs to it. multipleStatements is on only here: a migration file
// holds several statements, while the app's own pool keeps it off so injected SQL can't chain a second query.
const pool = mysql.createPool({ ...connectionOptions, connectionLimit: 1, multipleStatements: true });

// Line endings are ignored so a checkout on another system doesn't look like an edit.
const checksumOf = (sql) => createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");

async function loadMigrations() {
  const names = (await fs.readdir(MIGRATIONS_DIR)).filter((name) => MIGRATION_FILE.test(name)).sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), "utf8");
      return { name, sql, checksum: checksumOf(sql) };
    })
  );
}

// An applied file that later changes or disappears means this database no longer matches the folder.
function assertAppliedFilesUnchanged(applied, migrations) {
  const byName = new Map(migrations.map((m) => [m.name, m]));
  for (const [name, checksum] of applied) {
    const file = byName.get(name);
    if (!file) throw new ScriptStop(`${SCRIPT}: ${name} was applied but the file is gone. Restore it.`);
    if (file.checksum !== checksum) {
      throw new ScriptStop(`${SCRIPT}: ${name} changed after it was applied. Restore it and put the change in a new numbered file.`);
    }
  }
}

async function applyPending(conn) {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename VARCHAR(191) NOT NULL PRIMARY KEY,
       checksum CHAR(64) NOT NULL,
       applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  const [rows] = await conn.query("SELECT filename, checksum FROM schema_migrations");
  const applied = new Map(rows.map((row) => [row.filename, row.checksum]));
  const migrations = await loadMigrations();
  assertAppliedFilesUnchanged(applied, migrations);

  const pending = migrations.filter((m) => !applied.has(m.name));
  if (pending.length === 0) {
    console.log(`${SCRIPT}: nothing to do.`);
    return;
  }
  for (const { name, sql, checksum } of pending) {
    console.log(`${SCRIPT}: applying ${name}`);
    try {
      await conn.query(sql);
    } catch (err) {
      throw new ScriptStop(`${SCRIPT}: ${name} failed and was not recorded: ${err.message}`);
    }
    await conn.query("INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)", [name, checksum]);
  }
  console.log(`${SCRIPT}: applied ${pending.length} file(s).`);
}

async function main() {
  const conn = await pool.getConnection();
  try {
    // Two deploys at the same moment must not both apply the same file. MySQL frees the lock when the connection closes.
    const [[{ locked }]] = await conn.query("SELECT GET_LOCK(?, ?) AS locked", [LOCK_NAME, LOCK_TIMEOUT_SECONDS]);
    if (locked !== 1) throw new ScriptStop(`${SCRIPT}: another migration is still running. Try again when it finishes.`);
    await applyPending(conn);
  } finally {
    conn.release();
  }
}

runScript(main, pool);
