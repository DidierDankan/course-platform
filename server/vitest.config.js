import { defineConfig } from "vitest/config";

// Set before anything loads config.js. dotenv never overwrites a variable that is already set,
// so .env still supplies the secrets and only these change.
process.env.NODE_ENV = "test";
process.env.DB_NAME = "lumen_test";
// MySQL's default strict mode, so bad input fails here the way it would on a strict live server.
process.env.DB_SQL_MODE =
  "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";

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
