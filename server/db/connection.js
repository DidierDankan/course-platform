import config from "../config.js";
import mysql from "mysql2/promise";

// Shared with scripts/migrate.js, so settings such as SSL only need adding once.
export const connectionOptions = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
};

const pool = mysql.createPool({
  ...connectionOptions,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
