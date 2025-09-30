import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If user is already logged in → send them to welcome page
  if (isAuthenticated) {
    return <Navigate to="/profile/welcome" replace />;
  }

  return element;
};

export default PublicRoute;