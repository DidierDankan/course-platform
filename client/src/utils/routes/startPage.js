// Each role's dashboard (the header's "Dashboard" link). Admins share the seller pages (routeConfig.jsx roles).
const DASHBOARD_BY_ROLE = Object.freeze({
  admin: "/profile/dashboard",
  seller: "/profile/dashboard",
  user: "/user/dashboard",
});

export const dashboardFor = (role) => (Object.hasOwn(DASHBOARD_BY_ROLE, role) ? DASHBOARD_BY_ROLE[role] : "/");

// Where a newly registered account starts. A seller can't open the dashboard or portfolio before the profile has a
// name, a bio and a qualification (RequireProfileCompletion), so they start on the edit page, which says what's
// missing (ProfileCompletionNotice). A student starts on their dashboard.
export const startPageAfterRegister = (role) => (role === "seller" ? "/profile/edit" : dashboardFor(role));
