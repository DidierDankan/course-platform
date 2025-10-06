import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { isAuthenticated, initialized, user } = useSelector((s) => s.auth);

  if (!initialized) return <Spinner />; // wait until /me done

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/auth" replace />;
  }

  return element;
};

export default ProtectedRoute;
