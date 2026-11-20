// After a save, back to the user's own dashboard: a student sent to the seller dashboard was bounced to Home.
export const handleEditSubmit = (editUser, navigate, dashboardPath) => {
  return async (values, { setSubmitting, setStatus }) => {
    setStatus(undefined);
    try {
      await editUser(values).unwrap();
      navigate(dashboardPath);
    } catch (err) {
      setStatus(err?.data?.errors?.[0] || err?.data?.message || "Couldn't save your profile. Please try again.");
    }
    setSubmitting(false);
  };
};
