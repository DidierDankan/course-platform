import config from "../config.js";
import jwt from "jsonwebtoken";

const ALGORITHM = "HS256";
const ACCESS = { type: "access", secret: config.jwt.accessSecret, expiresIn: "15m" };
const REFRESH = { type: "refresh", secret: config.jwt.refreshSecret, expiresIn: "7d" };

const sign = (user, kind) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, type: kind.type }, kind.secret, {
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
export const generateRefreshToken = (user) => sign(user, REFRESH);
export const verifyAccessToken = (token) => verify(token, ACCESS);
export const verifyRefreshToken = (token) => verify(token, REFRESH);
