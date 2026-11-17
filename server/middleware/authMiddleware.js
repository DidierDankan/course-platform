import { verifyAccessToken } from "../helpers/tokens.js";

export const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" }); // ⛔ stop here
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next(); // ✅ only go forward if token is valid
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" }); // ⛔ stop here
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};

// For GET /api/auth/me only: a visitor with no session cookie at all is simply logged out, so the answer is
// 200 { user: null } instead of a 401 that makes the client try a refresh (two failing requests on every first visit).
// With a refresh cookie but no access token (it expired after 15 minutes) it still goes to authenticate -> 401, so the
// client refreshes as before.
export const anonymousIsNobody = (req, res, next) => {
  const hasSession = req.cookies?.token || req.cookies?.refreshToken || req.headers["authorization"];
  if (!hasSession) return res.json({ user: null });
  return next();
};
