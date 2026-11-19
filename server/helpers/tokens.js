import crypto from "node:crypto";
import config from "../config.js";
import jwt from "jsonwebtoken";

// Access token: a short-lived JWT, checked on every request without a database lookup.
const ALGORITHM = "HS256";
const ACCESS = { type: "access", secret: config.jwt.accessSecret, expiresIn: "15m" };
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // the access cookie lives as long as the token

// isDemo only changes what the client shows (a note on the demo account). Authorization never reads it: the demo guard
// (middleware/demoAccount.js) asks the database, so a token can't lift the restriction.
const sign = (user, kind) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, isDemo: Number(user.is_demo) === 1, type: kind.type }, kind.secret, {
    algorithm: ALGORITHM,
    expiresIn: kind.expiresIn,
  });

// Throws if the token is invalid, expired, or the wrong kind.
const verify = (token, kind) => {
  const decoded = jwt.verify(token, kind.secret, { algorithms: [ALGORITHM] });
  if (decoded.type !== kind.type) throw new jwt.JsonWebTokenError("wrong token type");
  return decoded;
};

export const generateAccessToken = (user) => sign(user, ACCESS);
export const verifyAccessToken = (token) => verify(token, ACCESS);

// Refresh token: 32 random bytes, not a JWT. It is looked up in the database on every use (so it can be revoked), so
// a signature would add nothing. The database only ever stores its SHA-256: a fast hash is enough because 256 random
// bits can't be guessed, unlike a password, which needs bcrypt.
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const generateRefreshToken = () => crypto.randomBytes(32).toString("base64url");
export const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
export const generateTokenFamilyId = () => crypto.randomBytes(16).toString("hex");
