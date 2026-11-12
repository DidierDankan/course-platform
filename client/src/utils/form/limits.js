// Field sizes the server enforces (server/validators/limits.js, from the column sizes in server/migrations).
// The server is what actually refuses a value; these only let the form say so before a request is sent.
// Keep the two files in sync: when a migration changes a column, change both.

const TEXT_CHARS = 16383; // a TEXT column: 65,535 bytes, up to 4 bytes per character

export const LIMITS = Object.freeze({
  email: 191,
  courseTitle: 255,
  courseDescription: TEXT_CHARS,
  lessonTitle: 255,
  lessonDescription: TEXT_CHARS,
  fullName: 255,
  phone: 20,
  website: 255,
  bio: TEXT_CHARS,
  skill: 100,
  qualificationTitle: 100,
  qualificationInstitution: 100,
  qualificationDescription: TEXT_CHARS,
  certificateUrl: TEXT_CHARS,
});

// bcrypt reads only the first 72 bytes of a password, so the server refuses longer ones at registration.
export const PASSWORD_MAX_BYTES = 72;
export const byteLength = (text) => new TextEncoder().encode(text ?? "").length;
