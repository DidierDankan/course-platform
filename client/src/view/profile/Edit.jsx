import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom";
import { ProfileSchema } from "@utils/form/profile/editValidation";
import { useEditProfileMutation, useGetProfileQuery } from "@api/modules/userApi";
import { handleEditSubmit } from "@utils/form/profile/editHandler";

import ImageUploadField from "@components/ui/Form/ImageUploadField";
import PhoneInputField from "@components/ui/Form/PhoneInputField";
import SkillsSelectionField from "@components/ui/Form/SkillsSelectionField";
import QualificationsFieldArray from "@components/ui/Form/QualificationsFieldArray";
import FormField from "@components/ui/Form/FormField";

const EditProfile = () => {
  const navigate = useNavigate();
  const [editUser] = useEditProfileMutation();
  const { data: profile, isLoading, isError, refetch } = useGetProfileQuery();

  if (isLoading) {
    return (
      <main className="page-main page-main-narrow">
        <div className="page-inline-loader" role="status" aria-label="Loading profile">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load your profile</h3>
          <p>Something went wrong on our side. Please try again.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  const hasProfileData =
    profile?.bio && profile?.phone && profile?.profile_image && Array.isArray(profile?.skills) && profile.skills.length > 0;

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">Update your profile</span>
        <h1>Edit your details</h1>
        <p>Keep your personal and professional info up to date.</p>
      </header>

      <section className="panel">
        <Formik
          initialValues={{
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
            phone: profile?.phone || "",
            website: profile?.website || "",
            profile_image: profile?.profile_image || "",
            skills: profile?.skills || [],
            qualifications:
              profile?.qualifications?.map((q) => ({
                ...q,
                issued_at: q.issued_at ? q.issued_at.split("T")[0] : "",
              })) || [],
          }}
          validationSchema={ProfileSchema}
          onSubmit={(values, helpers) => handleEditSubmit(editUser, navigate)(values, helpers)}
        >
          {({ isSubmitting, status }) => (
            <Form className="seller-form">
              <ImageUploadField />

              <div className="form-grid">
                <FormField name="full_name" label="Full name" />
                <PhoneInputField />
                <div className="form-grid-full">
                  <FormField name="bio" label="Bio" as="textarea" rows={4} />
                </div>
                <div className="form-grid-full">
                  <FormField name="website" label="Website" hint="Include https://" />
                </div>
              </div>

              <SkillsSelectionField />
              <QualificationsFieldArray />

              {status && (
                <p className="form-alert" role="alert">
                  {status}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className={`button button-primary ${isSubmitting ? "is-loading" : ""}`}
                >
                  {isSubmitting && <span className="spinner" aria-hidden="true" />}
                  {isSubmitting ? "Saving…" : "Save profile"}
                </button>

                {hasProfileData && (
                  <button type="button" className="button button-secondary" onClick={() => navigate("/profile/dashboard")}>
                    Cancel
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
};

export default EditProfile;
