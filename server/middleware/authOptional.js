import { verifyAccessToken } from "../helpers/tokens.js";

export const authenticateOptional = (req, res, next) => {
  try {
    // cookie token (your app uses cookies)
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = verifyAccessToken(token);

    req.user = decoded; // { id, role, ... } depending on your token payload
    return next();
  } catch (err) {
    // Invalid/expired token -> treat as guest
    return next();
  }
};