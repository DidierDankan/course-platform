// server/db/RefreshTokenService.js
// Stored refresh tokens: issue at login, rotate on every refresh, revoke at logout, and detect a replayed token.
// Only SHA-256 hashes of tokens are stored or queried. Every time comparison uses the database clock (NOW()), so Node's
// clock and MySQL's can't disagree about what has expired.
import db from "./connection.js";
import { withTransaction } from "./transaction.js";
import {
  REFRESH_TOKEN_TTL_SECONDS,
  generateRefreshToken,
  generateTokenFamilyId,
  hashRefreshToken,
} from "../helpers/tokens.js";

// Two tabs share one cookie jar: when both send the same token at once, the first rotates it and the second arrives
// with the token that was just replaced. Within this window that is an honest race, not theft, so it is answered
// (with an access token only: the jar already holds the successor). After it, a replaced token means a copy exists.
export const REUSE_GRACE_SECONDS = 30;

const insertToken = async (q, { userId, familyId }) => {
  const token = generateRefreshToken();
  const [result] = await q.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
     VALUES (?, ?, ?, NOW() + INTERVAL ? SECOND)`,
    [userId, hashRefreshToken(token), familyId, REFRESH_TOKEN_TTL_SECONDS]
  );
  return { token, id: result.insertId };
};

const loadUser = async (q, userId) => {
  // The database decides who the user is now: a role change applies at the next refresh.
  const [[user]] = await q.query("SELECT id, email, role, is_demo FROM users WHERE id = ?", [userId]);
  return user ?? null;
};

const revokeFamily = (q, familyId) =>
  q.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = ? AND revoked_at IS NULL", [familyId]);

class RefreshTokenService {
  // Login: a new family with its first token. Also deletes the user's expired tokens (no cron job on the free hosting).
  // Returns the token to put in the cookie; it is never stored.
  async issue(userId) {
    await db.query("DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at <= NOW()", [userId]);
    const { token } = await insertToken(db, { userId, familyId: generateTokenFamilyId() });
    return token;
  }

  // Refresh. Returns one of:
  //   { outcome: "rotated", user, token }  the token was valid: it is revoked and `token` replaces it
  //   { outcome: "grace", user }           it was replaced seconds ago by another tab: an access token, nothing else
  //   { outcome: "refused" }               unknown, expired, revoked by logout, or replayed (then its family is revoked)
  // One transaction with the row locked: two requests with the same token run one after the other, so the second
  // always sees the first one's result and a token is never rotated twice.
  async rotate(token) {
    return withTransaction(async (conn) => {
      const [[row]] = await conn.query(
        `SELECT id, user_id, family_id, replaced_by_id,
                revoked_at IS NOT NULL AS revoked,
                expires_at <= NOW() AS expired,
                revoked_at > NOW() - INTERVAL ? SECOND AS recently_revoked
         FROM refresh_tokens WHERE token_hash = ? FOR UPDATE`,
        [REUSE_GRACE_SECONDS, hashRefreshToken(token)]
      );
      if (!row) return { outcome: "refused" };

      if (row.revoked) {
        // Grace only for a token a refresh replaced (logout sets no successor), and only while the login is still
        // alive: after a logout in the other tab, the old token must not bring the session back.
        if (row.replaced_by_id && row.recently_revoked) {
          const [[live]] = await conn.query(
            "SELECT id FROM refresh_tokens WHERE family_id = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1",
            [row.family_id]
          );
          const user = live ? await loadUser(conn, row.user_id) : null;
          if (user) return { outcome: "grace", user };
        }
        // A revoked token came back: someone else holds a copy. End that whole login, for the thief and the owner.
        await revokeFamily(conn, row.family_id);
        return { outcome: "refused" };
      }

      if (row.expired) return { outcome: "refused" };

      const user = await loadUser(conn, row.user_id);
      if (!user) return { outcome: "refused" };

      const next = await insertToken(conn, { userId: row.user_id, familyId: row.family_id });
      await conn.query("UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by_id = ? WHERE id = ?", [next.id, row.id]);
      return { outcome: "rotated", user, token: next.token };
    });
  }

  // Logout: revoke the whole login this token belongs to. An unknown token is fine (nothing to revoke).
  async revoke(token) {
    const [[row]] = await db.query("SELECT family_id FROM refresh_tokens WHERE token_hash = ?", [hashRefreshToken(token)]);
    if (row) await revokeFamily(db, row.family_id);
  }
}

export default new RefreshTokenService();
