import { setCredentials } from '@store/slices/authSlice';

export const handleRegisterSubmit = (registerUser, navigate) => {
  return async (values, { setSubmitting, setErrors }) => {
    try {
      await registerUser(values).unwrap();
      navigate('/auth/login');
    } catch (err) {
      setErrors({ email: err?.data?.message || 'Registration failed' });
    }
    setSubmitting(false);
  };
};

export const handleLoginSubmit = (loginUser, navigate, dispatch, from = "/") => {
  return async (values, { setSubmitting, setStatus }) => {
    setStatus(undefined);
    try {
      const response = await loginUser(values).unwrap();

      dispatch(setCredentials({
        user: response.user,
      }));

      navigate(from, { replace: true });
    } catch (err) {
      // One message for the whole form: pinning it to the email field would hint that the email was the problem.
      setStatus(err?.data?.message || 'Login failed. Please try again.');
    }
    setSubmitting(false);
  };
};
