import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);

  if (!initialized) return <Spinner />; // or <LoadingSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;