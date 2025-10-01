import React from 'react';
import { Formik, Form } from 'formik';
import { useNavigate } from 'react-router-dom';
import { ProfileSchema } from '@utils/form/profile/editValidation';
import { useEditProfileMutation, useGetProfileQuery } from '@api/modules/userApi';
import { handleEditSubmit } from '@utils/form/profile/editHandler';

import ImageUploadField from '@components/ui/Form/ImageUploadField';
import PhoneInputField from '@components/ui/Form/PhoneInputField';
import SkillsSelectionField from '@components/ui/Form/SkillsSelectionField';
import QualificationsFieldArray from '@components/ui/Form/QualificationsFieldArray';
import FormikInput from '@components/ui/Form/FormikInput';

const EditProfile = () => {
  const navigate = useNavigate();
  const [editUser] = useEditProfileMutation(); // ✅ destructure correctly

  const { data: profile, isLoading, refetch } = useGetProfileQuery();

  if (isLoading) return <p>Loading profile...</p>;

  const hasProfileData =
    profile?.bio &&
    profile?.phone &&
    profile?.profile_image &&
    (Array.isArray(profile?.skills) && profile.skills.length > 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Your Profile</h2>

      <Formik
        initialValues={{
          full_name: profile?.full_name || '',
          bio: profile?.bio || '',
          phone: profile?.phone || '',
          website: profile?.website || '',
          profile_image: profile?.profile_image || '',
          skills: profile?.skills || [],
          qualifications: profile?.qualifications?.map((q) => ({
          ...q,
          issued_at: q.issued_at ? q.issued_at.split('T')[0] : '', // 👈 this is key
        })) || [],
        }}
        validationSchema={ProfileSchema}
        onSubmit={ (values, formikHelpers) => {
          return handleEditSubmit(editUser, navigate)(values, formikHelpers);
        }}
      >
        {({ values, errors, touched, isSubmitting, isValid, dirty, setFieldValue }) => {
          return (
            <Form className="space-y-6">
              {/* Profile Image */}

              <ImageUploadField />
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormikInput name="full_name" label="Full Name" />

                <div>
                  <PhoneInputField />
                </div>

                <div className="md:col-span-2">
                  <FormikInput name="bio" label="Bio" as="textarea" />
                </div>

                <FormikInput name="website" label="Website" />

              </div>

              {/* Skills Input */}
              <SkillsSelectionField />

              {/* Qualifications */}
              <QualificationsFieldArray />

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
              {hasProfileData && (
                <button
                  type="button"
                  className="btn-secondary ml-[10px]"
                  onClick={() => navigate('/profile/welcome')}
                >
                  Cancel
                </button>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default EditProfile;
