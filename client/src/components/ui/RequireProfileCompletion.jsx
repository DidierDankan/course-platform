import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RequireProfileCompletion = ({ children }) => {
  const { profile, isLoading } = useSelector((state) => state.user);

  // Still loading → don’t decide yet
  if (isLoading) return null;

  // If profile exists but is incomplete → redirect to edit
  if (profile) {
    const isIncomplete =
      !profile.full_name || !profile.bio || !profile.qualifications?.length;

    if (isIncomplete) {
      return <Navigate to="/profile/edit" replace />;
    }
  }

  // Otherwise → allow normal route
  return children;
};

export default RequireProfileCompletion;
