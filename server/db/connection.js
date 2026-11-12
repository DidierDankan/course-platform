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
  // mysql2 turns an object value into SQL: `WHERE id = ?` with {"id": 1} becomes WHERE id = `id` = 1, which is
  // true for every row (a known auth-bypass pattern in Node + MySQL apps). With this, an object that slips past a
  // validator becomes the text '[object Object]' instead. Arrays (bulk VALUES ?) and Dates are not affected.
  stringifyObjects: true,
});

// Each new connection gets the pinned SQL mode before it runs anything else (a connection runs its queries in order).
// If the SET fails, the connection is destroyed: whatever query was queued behind it then fails loudly instead of
// running under the server's default (possibly looser) mode, and the pool opens a fresh connection next time.
if (config.db.sqlMode) {
  pool.on("connection", (conn) => {
    conn.query("SET SESSION sql_mode = ?", [config.db.sqlMode], (err) => {
      if (!err) return;
      console.error(`Could not set sql_mode, dropping the connection: ${err.message}`);
      conn.destroy();
    });
  });
}

export default pool;
