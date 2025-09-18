

export const handleEditSubmit = (EditUser, navigate) => {
  return async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await EditUser(values).unwrap();
      console.log("EDIT PROFILE RESP", response)
      navigate('/profile/welcome');
      // No need to manually call fetchProfile here
    } catch (err) {
      setErrors({ email: err?.data?.message || 'Edit profile failed' });
    }
    setSubmitting(false);
  };
};