// server/lib/answerError.js
import { logError } from "./logError.js";

// Answers a failed request: an expected refusal carries a status (403, 404, 409, made with httpError) and its message
// goes to the client; anything else is a bug, logged without data (logError) and answered with a generic 500.
export const httpError = (status, message) => Object.assign(new Error(message), { status });

export function answerError(res, context, err) {
  if (err?.status) return res.status(err.status).json({ message: err.message });
  logError(context, err);
  return res.status(500).json({ message: "Server error" });
}
