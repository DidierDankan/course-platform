// server/lib/publicNames.js
// How people are named on public pages (reviews, comments). One place, so every page follows the same privacy rule.
import { APP_NAME } from "./brand.js";

// A student is "Sam R.": first name and last initial, never the full name or email. A course page shouldn't reveal
// who its students are. Without a profile name: "Student".
export const studentName = (fullName) => {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Student";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1)[0].toUpperCase()}.`;
};

// The course's own instructor is public anyway (course cards name them), so they keep their profile name.
export const instructorName = (fullName) => String(fullName ?? "").trim() || "Instructor";

// Admins speak for the platform.
export const TEAM_NAME = `${APP_NAME} team`;
