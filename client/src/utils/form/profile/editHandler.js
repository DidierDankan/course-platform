export const handleEditSubmit = (editUser, navigate) => {
  return async (values, { setSubmitting, setStatus }) => {
    setStatus(undefined);
    try {
      await editUser(values).unwrap();
      navigate("/profile/dashboard");
    } catch (err) {
      setStatus(err?.data?.message || "Couldn't save your profile. Please try again.");
    }
    setSubmitting(false);
  };
};
