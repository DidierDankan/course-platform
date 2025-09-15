import { setCredentials } from '@store/slices/authSlice';

export const handleRegisterSubmit = (registerUser, navigate) => {
  return async (values, { setSubmitting, setErrors }) => {
    try {
      await registerUser(values).unwrap();
      navigate('/login');
    } catch (err) {
      setErrors({ email: err?.data?.message || 'Registration failed' });
    }
    setSubmitting(false);
  };
};

export const handleLoginSubmit = (LoginUser, navigate, dispatch) => {
  return async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await LoginUser(values).unwrap();

      // ✅ Save user info in Redux
      dispatch(setCredentials({
        user: response.user,
      }));

      navigate('/profile/welcome');
    } catch (err) {
      setErrors({ email: err?.data?.message || 'Login failed' });
    }
    setSubmitting(false);
  };
};