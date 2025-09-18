// src/view/layout/AuthGate.jsx
import { useSelector } from 'react-redux';
import { useGetProfileQuery } from '@api/modules/userApi';
import Spinner from '@components/ui/Spinner';

const ProfileFetch = ({ children }) => {
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);

  const { isLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!initialized) return <Spinner />;

  if (!isAuthenticated || isLoading) return <Spinner />;

  return children;
};

export default ProfileFetch;
