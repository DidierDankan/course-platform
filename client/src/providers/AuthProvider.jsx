// src/providers/AuthProvider.jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '@store/slices/authSlice';
import { useGetCurrentUserQuery } from '@api/modules/authApi';
import Spinner from '@components/ui/Spinner';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetCurrentUserQuery();

  useEffect(() => {
    if (data?.user) {
      dispatch(setCredentials({ user: data.user }));
    } else if (isError) {
      dispatch(logout());
    }
  }, [data, isError, dispatch]);

  if (isLoading) return <Spinner />;

  return children;
};

export default AuthProvider;
