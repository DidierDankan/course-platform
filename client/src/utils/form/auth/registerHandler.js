import { setCredentials } from '@store/slices/authSlice';

const EMAIL_TAKEN = 409;

export const handleRegisterSubmit = (registerUser, navigate) => {
  return async (values, { setSubmitting, setErrors, setStatus }) => {
    setStatus(undefined);
    try {
      await registerUser(values).unwrap();
      navigate('/auth/login');
    } catch (err) {
      const message = err?.data?.message || 'Registration failed. Please try again.';
      // Only "email already registered" belongs to a field; the rest concern the whole form.
      if (err?.status === EMAIL_TAKEN) setErrors({ email: message });
      else setStatus(message);
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
