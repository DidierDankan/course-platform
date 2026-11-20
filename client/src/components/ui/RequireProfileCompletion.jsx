import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { missingSellerProfileParts } from '@utils/profile';

// Sends a seller with an incomplete profile to the edit page, which says what's missing (ProfileCompletionNotice).
// The state flag tells that page the visit is a redirect, so it can point the seller at the notice.
const RequireProfileCompletion = ({ children }) => {
  const { profile, isLoading } = useSelector((state) => state.user);

  // Still loading → don't decide yet
  if (isLoading) return null;

  if (missingSellerProfileParts(profile).length) {
    return <Navigate to="/profile/edit" replace state={{ profileIncomplete: true }} />;
  }

  return children;
};

export default RequireProfileCompletion;
