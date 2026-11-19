// server/middleware/demoAccount.js
// The demo accounts' password is on the login page, so anyone can sign in as them. These writes would break the demo
// for the next visitor (delete the demo courses, upload files, rename the instructor), so the server refuses them for a
// demo account. Everything a visitor comes to try (buying with the test card, progress, favorites, reviews, comments)
// stays allowed; the daily reset (DemoService.resetIfDue) puts that back.
// The flag is read from the database on each guarded request, not from the token, so it applies at once.
// Place after authenticate and before any upload middleware, so a refused request never writes a file.
import DemoService from "../db/DemoService.js";
import { logError } from "../lib/logError.js";

export const DEMO_REFUSAL = "The demo account can't do this, so the demo stays the same for everyone. Register your own account to try it.";

export const refuseDemoAccount = async (req, res, next) => {
  try {
    if (await DemoService.isDemoAccount(req.user.id)) {
      return res.status(403).json({ message: DEMO_REFUSAL });
    }
    return next();
  } catch (err) {
    logError("refuseDemoAccount", err);
    return res.status(500).json({ message: "Server error" });
  }
};
