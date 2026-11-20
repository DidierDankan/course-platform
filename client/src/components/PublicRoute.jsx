import { useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

// Login and register are for signed-out visitors: someone who ARRIVES signed in is sent Home. Signing in ON the page
// (login, or register, which signs the new account in) is that page's job: its handler picks the destination. A
// redirect here would race it: the next page loads lazily, React keeps this page on screen meanwhile, and this guard
// would see the new session and send everyone to "/" instead. AuthGate renders nothing until the session is known,
// so the value at mount is the real one.
const PublicRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const arrivedSignedIn = useRef(isAuthenticated);

  if (arrivedSignedIn.current) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default PublicRoute;
