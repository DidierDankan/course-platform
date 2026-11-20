// What a seller's saved profile still needs before the seller pages (dashboard, portfolio) open: the public instructor
// page shows the name, the bio and the qualifications. One rule for the route guard (RequireProfileCompletion) and the
// notice on the edit page (ProfileCompletionNotice), so the two can't disagree. Returns [] when nothing is missing.
// This is UX only: the server doesn't require a complete profile to sell.
export const missingSellerProfileParts = (profile) => {
  if (!profile) return [];
  const missing = [];
  if (!profile.full_name?.trim()) missing.push("your full name");
  if (!profile.bio?.trim()) missing.push("a bio");
  if (!profile.qualifications?.length) missing.push("at least one qualification");
  return missing;
};

// ["a", "b", "c"] -> "a, b and c"
export const listInWords = (items) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

// Roles whose pages sit behind RequireProfileCompletion (routeConfig.jsx: /profile/dashboard, /profile/portfolio).
export const ROLES_NEEDING_SELLER_PROFILE = Object.freeze(["seller", "admin"]);
