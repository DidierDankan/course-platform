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