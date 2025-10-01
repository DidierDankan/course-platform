import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" }); // ⛔ stop here
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // ✅ only go forward if token is valid
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" }); // ⛔ stop here
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
