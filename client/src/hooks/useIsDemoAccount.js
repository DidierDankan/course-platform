import { useSelector } from "react-redux";

// True on the public demo accounts (their password is on the login page). Only for what the page shows: the server
// refuses the demo's protected changes whatever the client thinks (server/middleware/demoAccount.js).
export const useIsDemoAccount = () => useSelector((s) => s.auth.user?.isDemo === true);
