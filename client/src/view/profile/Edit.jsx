import React from "react";
import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom";
import { ProfileSchema } from "@utils/form/profile/editValidation";
import {
  useEditProfileMutation,
  useGetProfileQuery,
} from "@api/modules/userApi";
import { handleEditSubmit } from "@utils/form/profile/editHandler";

import ImageUploadField from "@components/ui/Form/ImageUploadField";
import PhoneInputField from "@components/ui/Form/PhoneInputField";
import SkillsSelectionField from "@components/ui/Form/SkillsSelectionField";
import QualificationsFieldArray from "@components/ui/Form/QualificationsFieldArray";
import FormikInput from "@components/ui/Form/FormikInput";
import { BookOpen } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const [editUser] = useEditProfileMutation();
  const { data: profile, isLoading } = useGetProfileQuery();

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#f8fafc] text-center pt-[80px] text-[#475569]">
        Loading profile...
      </div>
    );

  const hasProfileData =
    profile?.bio &&
    profile?.phone &&
    profile?.profile_image &&
    Array.isArray(profile?.skills) &&
    profile.skills.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">

      <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
        {/* Heading */}
        <div className="text-center mb-[24px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Update Your Profile</span>
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-[1.15] text-[#1e293b]">
            Edit Your Details
          </h1>
          <p className="mt-[6px] text-[14px] text-[#475569]">
            Keep your personal and professional info up to date.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[16px] p-[28px] sm:p-[36px]">
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
            onSubmit={(values, helpers) =>
              handleEditSubmit(editUser, navigate)(values, helpers)
            }
          >
            {({ isSubmitting }) => (
              <Form className="space-y-[20px]">
                {/* Profile Image */}
                <div>
                  <ImageUploadField />
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  <FormikInput name="full_name" label="Full Name" />
                  <PhoneInputField />
                  <div className="md:col-span-2">
                    <FormikInput name="bio" label="Bio" as="textarea" />
                  </div>
                  <FormikInput name="website" label="Website" />
                </div>

                {/* Skills */}
                <div>
                  <SkillsSelectionField />
                </div>

                {/* Qualifications */}
                <div>
                  <QualificationsFieldArray />
                </div>

                {/* Buttons */}
                <div className="pt-[10px] flex flex-wrap gap-[12px]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium text-[14px] px-[16px] py-[10px] rounded-[8px] shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition"
                  >
                    {isSubmitting ? "Saving..." : "Save Profile"}
                  </button>

                  {hasProfileData && (
                    <button
                      type="button"
                      onClick={() => navigate("/profile/dashboard")}
                      className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] font-medium text-[14px] px-[16px] py-[10px] rounded-[8px] transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
