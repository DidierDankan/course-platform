import config from '../config.js';
import { ACCESS_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_TTL_SECONDS, generateAccessToken } from '../helpers/tokens.js';
import RefreshTokenService from '../db/RefreshTokenService.js';
import UserService from '../db/UserService.js';
import { logError } from '../lib/logError.js';

// The refresh cookie is only sent to /api/auth (refresh and logout), not with every API call and video request.
const REFRESH_COOKIE_PATH = '/api/auth';
const cookieBase = { httpOnly: true, secure: config.isProduction, sameSite: 'lax' };
const ACCESS_COOKIE = { ...cookieBase, path: '/' };
const REFRESH_COOKIE = { ...cookieBase, path: REFRESH_COOKIE_PATH };

const setAccessCookie = (res, user) =>
  res.cookie('token', generateAccessToken(user), { ...ACCESS_COOKIE, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
const setRefreshCookie = (res, token) =>
  res.cookie('refreshToken', token, { ...REFRESH_COOKIE, maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000 });

// Before Stage 3 the refresh cookie lived at Path=/. Browsers keep that one next to the new cookie until it expires,
// so it is cleared on every login, refresh and logout. Remove this 7 days after Stage 3 ships (no such cookie left).
const clearLegacyRefreshCookie = (res) => res.clearCookie('refreshToken', { ...cookieBase, path: '/' });

// A new login (one refresh-token family): the access cookie plus a fresh refresh token. Used by login and register.
const startSession = async (res, user) => {
  setAccessCookie(res, user);
  setRefreshCookie(res, await RefreshTokenService.issue(user.id));
  clearLegacyRefreshCookie(res);
};

// The only user fields any auth answer contains (never iat/exp, never the hash).
const publicUser = (user) => ({ id: user.id, email: user.email, role: user.role, isDemo: Number(user.is_demo) === 1 });

class AuthController {
  async register(req, res) {
    try {
      const { email, password, role } = req.body;

      // 1️⃣ Validate required fields
      if (!email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const normalizedRole = role.toLowerCase();

      // 2️⃣ Only allow learner or instructor
      const allowedRoles = ["user", "seller"];
      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ message: "Invalid role." });
      }

      // 3️⃣ Prevent admin registration
      if (normalizedRole === "admin") {
        return res.status(403).json({ message: "Cannot assign admin role via registration." });
      }

      // 4️⃣ Check if user already exists
      const existingUser = await UserService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered." });
      }

      // 5️⃣ Create user (UserService handles hashing & validation)
      const newUser = await UserService.createUser({
        email,
        password,
        role: normalizedRole,
      });

      // 6️⃣ Sign the new user in, exactly as login does: they just proved the password by choosing it, so a second
      // form would add nothing. The register limit still counts this request.
      await startSession(res, newUser);
      return res.status(201).json({ message: "User registered successfully.", user: publicUser(newUser) });
    } catch (err) {
      logError("Register", err);
      return res.status(500).json({ message: "Server error." });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const isValid = await UserService.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      await startSession(res, user);
      return res.json({ message: "Login successful", user: publicUser(user) });
    } catch (err) {
      logError("Login", err);
      return res.status(500).json({ message: "Server error." });
    }
  }
  
  // POST /api/auth/refresh. Rotates the refresh token (it works once) and issues a new access token for the user as the
  // database has them now. A token replaced seconds ago by another tab gets an access token only; see RefreshTokenService.
  async refresh(req, res) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: "No refresh token provided" });

      const result = await RefreshTokenService.rotate(token);
      if (result.outcome === "refused") {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      setAccessCookie(res, result.user);
      if (result.outcome === "rotated") setRefreshCookie(res, result.token);
      clearLegacyRefreshCookie(res);
      return res.json({ message: "Token refreshed", user: publicUser(result.user) });
    } catch (err) {
      logError("Refresh", err);
      return res.status(500).json({ message: "Server error." });
    }
  }

  // POST /api/auth/logout. Revokes the login on the server, so a copied refresh cookie stops working, then clears the
  // cookies. Needs only the refresh cookie: logging out works even after the access token has expired.
  async logout(req, res) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await RefreshTokenService.revoke(token);
    } catch (err) {
      // The cookies are still cleared below; the stored token then expires on its own within 7 days.
      logError("Logout", err);
    }
    res.clearCookie('token', ACCESS_COOKIE);
    res.clearCookie('refreshToken', REFRESH_COOKIE);
    clearLegacyRefreshCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
  }

  me(req, res) {
    return res.json({ user: req.user });
  }

}

export default new AuthController();
