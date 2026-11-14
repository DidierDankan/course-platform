import db from "./connection.js";

// Runs work(conn) on one connection inside one transaction: commit when it resolves, rollback when it throws, and the
// original error is passed on. Pass `conn` to every query of the unit, or that query runs outside the transaction.
// If the rollback itself fails, the connection is in an unknown state, so it is destroyed instead of going back to the
// pool (the original error is still the one rethrown and logged by the caller).
export async function withTransaction(work) {
  const conn = await db.getConnection();
  let broken = false;
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      broken = true;
    }
    throw err;
  } finally {
    if (broken) conn.destroy();
    else conn.release();
  }
}
