// src/view/layout/AuthGate.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCurrentUserQuery } from '@api/modules/authApi';
import { setCredentials, logout, setInitialized } from '@store/slices/authSlice';
import Spinner from '@components/ui/Spinner';

const AuthGate = ({ children }) => {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  const { data, isError, isLoading } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (data?.user) {
      dispatch(setCredentials({ user: data.user }));
    }
    if (isError) {
      dispatch(logout());
    }

    // ✅ always mark initialized once loading is done
    if (!isLoading) {
      dispatch(setInitialized());
    }
  }, [data, isError, isLoading, dispatch]);


  if (!initialized) return <Spinner />;

  return children;
};

export default AuthGate;
