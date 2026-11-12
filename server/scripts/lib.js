// server/scripts/lib.js
// Helpers shared by the data scripts (seed-demo.js, cleanup-test-data.js). Not used by the server.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../config.js";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_DIR = path.resolve(SCRIPTS_DIR, "..");
// Same folder the server serves at /uploads (CourseService and multer write there).
export const UPLOADS_DIR = config.uploadDir;
export const UPLOADS_URL_PREFIX = "/uploads/";

export class ScriptStop extends Error {}

// Both scripts write or delete data, so a production database needs an explicit --force.
export function refuseProductionUnlessForced(scriptName) {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    throw new ScriptStop(
      `${scriptName}: NODE_ENV=production. Refusing to touch a production database.\n` +
        `Re-run with --force only if you really mean it.`
    );
  }
}

// "/uploads/abc.mp4" -> absolute path inside UPLOADS_DIR, or null for anything else
// (external URLs, "../" tricks): a script must never delete a file outside the uploads folder.
export function uploadPathFromUrl(url) {
  if (typeof url !== "string" || !url.startsWith(UPLOADS_URL_PREFIX)) return null;
  const resolved = path.resolve(UPLOADS_DIR, url.slice(UPLOADS_URL_PREFIX.length));
  return resolved.startsWith(UPLOADS_DIR + path.sep) ? resolved : null;
}

export async function removeUploadFile(url) {
  const file = uploadPathFromUrl(url);
  if (!file) return false;
  try {
    await fs.unlink(file);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false; // already gone: the goal state
    throw err;
  }
}

// Runs main(), prints ScriptStop messages without a stack trace, always closes the DB pool.
export async function runScript(main, pool) {
  try {
    await main();
  } catch (err) {
    if (err instanceof ScriptStop) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
