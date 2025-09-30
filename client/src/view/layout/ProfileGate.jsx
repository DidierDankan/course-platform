// src/view/layout/ProfileGate.jsx
import { useSelector } from 'react-redux';
import { useGetProfileQuery } from '@api/modules/userApi';

const ProfileGate = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  return children; // ✅ never block, just hydrate silently
};

export default ProfileGate;
