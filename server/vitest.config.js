import { defineConfig } from "vitest/config";
import os from "node:os"
import path from "node:path";

// Set before anything loads config.js. dotenv never overwrites a variable that is already set,
// so .env still supplies the secrets and only these change.
process.env.NODE_ENV = "test";
process.env.DB_NAME = "lumen_test";
// MySQL's default strict mode, so bad input fails here the way it would on a strict live server.
process.env.DB_SQL_MODE =
  "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";
// Uploads go to a throwaway folder; globalSetup empties it, so it must never be the real server/uploads.
process.env.UPLOAD_DIR = path.join(os.tmpdir(), "lumen-test-uploads");


export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    globalSetup: ["./test/globalSetup.js"],
    setupFiles: ["./test/setup.js"],
    // Every file shares one database, so files run one after another. Requests inside a file can still run in parallel.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
