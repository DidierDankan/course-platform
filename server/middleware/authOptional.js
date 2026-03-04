import jwt from "jsonwebtoken";

export const authenticateOptional = (req, res, next) => {
  try {
    // cookie token (your app uses cookies)
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... } depending on your token payload
    return next();
  } catch (err) {
    // Invalid/expired token -> treat as guest
    return next();
  }
};