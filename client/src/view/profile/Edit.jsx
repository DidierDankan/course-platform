import React from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';
import { ProfileSchema } from '@utils/form/profile/editValidation';
import ImageUploadField from '@components/ui/ImageUploadField';
import { useEditProfileMutation, useGetProfileQuery } from '@api/modules/userApi';
import { handleEditSubmit } from '@utils/form/profile/editHandler';

const EditProfile = () => {
  const navigate = useNavigate();
  const [editUser] = useEditProfileMutation(); // ✅ destructure correctly

  const { data: profile, isLoading, refetch } = useGetProfileQuery();

  if (isLoading) return <p>Loading profile...</p>;

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
          qualifications: profile?.qualifications || [],
        }}
        validationSchema={ProfileSchema}
        onSubmit={ (values, formikHelpers) => {
          console.log('✅ Formik onSubmit triggered!', values);
          return handleEditSubmit(editUser, navigate)(values, formikHelpers);
        }}
      >
        {({ values, errors, touched, isSubmitting, isValid, dirty, setFieldValue }) => {
          console.log(values)
          return (
            <Form className="space-y-6">
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Full Name</label>
                  <Field name="full_name" className="input" />
                  <ErrorMessage name="full_name" component="div" className="text-red-500 text-sm" />
                </div>

                <div>
                  <label>Phone Number</label>
                  <Field name="phone" className="input" />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label>Bio</label>
                  <Field as="textarea" name="bio" className="input" />
                  <ErrorMessage name="bio" component="div" className="text-red-500 text-sm" />
                </div>

                <div>
                  <label>Website</label>
                  <Field name="website" className="input" />
                  <ErrorMessage name="website" component="div" className="text-red-500 text-sm" />
                </div>

                <ImageUploadField />
              </div>

              {/* Skills Input */}
              <div>
                <label>Skills (comma separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="JavaScript, React, CSS"
                  onChange={(e) =>
                    setFieldValue(
                      'skills',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <ErrorMessage name="skills" component="div" className="text-red-500 text-sm" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {values.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <FieldArray name="qualifications">
                {({ push, remove }) => (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Qualifications</h3>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          push({
                            title: '',
                            institution: '',
                            description: '',
                            certificate_url: '',
                            issued_at: '',
                          })
                        }
                      >
                        + Add
                      </button>
                    </div>

                    {values.qualifications.map((_, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 mt-4 rounded"
                      >
                        <div>
                          <label>Title</label>
                          <Field name={`qualifications[${index}].title`} className="input" />
                          <ErrorMessage
                            name={`qualifications[${index}].title`}
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>

                        <div>
                          <label>Institution</label>
                          <Field name={`qualifications[${index}].institution`} className="input" />
                          <ErrorMessage
                            name={`qualifications[${index}].institution`}
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label>Description</label>
                          <Field
                            as="textarea"
                            name={`qualifications[${index}].description`}
                            className="input"
                          />
                        </div>

                        <div>
                          <label>Certificate URL</label>
                          <Field name={`qualifications[${index}].certificate_url`} className="input" />
                        </div>

                        <div>
                          <label>Issued At</label>
                          <Field
                            type="date"
                            name={`qualifications[${index}].issued_at`}
                            className="input"
                          />
                          <ErrorMessage
                            name={`qualifications[${index}].issued_at`}
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default EditProfile;
