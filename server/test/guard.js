import config from "../config.js";
import os from "node:os";
import path from "node:path";

// Tests delete rows and rebuild the database, so they must never touch lumen_dev or production.
export function assertTestDatabase() {
  if (!config.db.name.endsWith("_test")) {
    throw new Error(`Refusing to run tests on "${config.db.name}": the database name must end in _test.`);
  }
}

// The test setup deletes the upload folder, so it must be a throwaway folder inside the OS temp folder.
export function assertTestUploadDir() {
  const relative = path.relative(os.tmpdir(), config.uploadDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to use "${config.uploadDir}" for test uploads: it must be inside ${os.tmpdir()}.`);
  }
}
