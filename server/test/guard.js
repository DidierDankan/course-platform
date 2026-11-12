import config from "../config.js";

// Tests delete rows and rebuild the database, so they must never touch lumen_dev or production.
export function assertTestDatabase() {
  if (!config.db.name.endsWith("_test")) {
    throw new Error(`Refusing to run tests on "${config.db.name}": the database name must end in _test.`);
  }
}
