import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireProfileCompletion = ({ children }) => {
  const { profile } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) {
      const isIncomplete =
        !profile?.name || !profile?.bio || !profile?.qualifications?.length;

      if (isIncomplete) {
        navigate('/profile/edit');
      }
    }
  }, [profile, navigate]);

  return children;
};

export default RequireProfileCompletion;
