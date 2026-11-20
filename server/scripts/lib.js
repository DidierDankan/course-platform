// server/scripts/lib.js
// Helpers shared by the data scripts (seed-demo.js, cleanup-test-data.js). Not used by the server.
import path from "node:path";
import { fileURLToPath } from "node:url";
import storage from "../lib/storage.js";
import { UPLOADS_URL_PREFIX, fileNameOf, uploadUrl } from "../lib/mediaTypes.js";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_DIR = path.resolve(SCRIPTS_DIR, "..");
export { UPLOADS_URL_PREFIX };
// The demo accounts seed-demo.js creates (defined in lib/demoContent.js); load.js logs in as the student.
export { DEMO_INSTRUCTOR_EMAIL, DEMO_STUDENT_EMAIL } from "../lib/demoContent.js";

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

// True only for "/uploads/<name>" with a plain file name: external URLs and "../" tricks are never ours to delete.
export function isStoredUploadUrl(url) {
  if (typeof url !== "string" || !url.startsWith(UPLOADS_URL_PREFIX)) return false;
  const name = url.slice(UPLOADS_URL_PREFIX.length);
  return name !== "" && fileNameOf(name) === name;
}

// Removes a stored file from wherever the storage keeps it (lib/storage.js: the uploads folder or Supabase).
// True if it was there; already gone is the goal state.
export async function removeUploadFile(url) {
  return isStoredUploadUrl(url) ? storage.remove(url) : false;
}

// Stores a copy of a local file under a server-chosen name, like an upload, and returns its "/uploads/..." URL.
export async function storeFileCopy(source, name) {
  await storage.putFile(source, name);
  return uploadUrl(name);
}

// Runs main(), prints ScriptStop messages without a stack trace, and closes the DB pool if one was given.
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
    await pool?.end();
  }
}
