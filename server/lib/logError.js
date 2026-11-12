// server/lib/logError.js
// Logs an unexpected server error without the data inside it.
// A mysql2 error carries err.sql (the query with the user's values filled in: a new user's bcrypt hash and email,
// whatever was typed into a form) and a message that can quote a value ("Duplicate entry 'a@b.co' for key ...").
// Hosted logs (Render) are kept and readable from the dashboard, so neither is ever written. For a database error
// what stays is the context, MySQL's error code and the stack frames: enough to find the failing query in the code.
// Any other error keeps its message, which is how a bug like "Cannot read properties of undefined" gets debugged.
// Production version: a structured logger (pino) with redaction rules and a request id per line.

const isDatabaseError = (err) => typeof err?.sql === "string" || typeof err?.sqlMessage === "string";

// The stack without its first line, which repeats the message.
const stackFrames = (err) => (typeof err?.stack === "string" ? err.stack.split("\n").slice(1).join("\n") : "");

export function logError(context, err) {
  if (isDatabaseError(err)) {
    console.error(`${context}: database error ${err.code ?? "?"} (errno ${err.errno ?? "?"}, sqlState ${err.sqlState ?? "?"})\n${stackFrames(err)}`);
    return;
  }
  const name = err?.name ?? "Error";
  const message = err?.message ?? String(err);
  console.error(`${context}: ${name}: ${message}\n${stackFrames(err)}`);
}
