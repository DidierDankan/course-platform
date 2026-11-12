import * as Yup from "yup";
import { LIMITS } from "@utils/form/limits";

// Limits mirror the server (utils/form/limits.js); the server is what enforces them.
const atMost = (max) => `${max} characters at most`;

export const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().max(LIMITS.fullName, atMost(LIMITS.fullName)).required("Full name is required"),
  bio: Yup.string().max(LIMITS.bio, atMost(LIMITS.bio)).required("Bio is required"),
  phone: Yup.string().max(LIMITS.phone, atMost(LIMITS.phone)).required("Phone number is required"),
  website: Yup.string().url("Invalid URL").max(LIMITS.website, atMost(LIMITS.website)).nullable(),
  // A stored file name, or a File when a new photo was picked.
  profile_image: Yup.mixed().nullable(),

  skills: Yup.array().of(Yup.string().max(LIMITS.skill, atMost(LIMITS.skill))).min(1, "Add at least one skill"),

  qualifications: Yup.array().of(
    Yup.object().shape({
      title: Yup.string().max(LIMITS.qualificationTitle, atMost(LIMITS.qualificationTitle)).required("Title is required"),
      institution: Yup.string().max(LIMITS.qualificationInstitution, atMost(LIMITS.qualificationInstitution)).nullable(),
      description: Yup.string().max(LIMITS.qualificationDescription, atMost(LIMITS.qualificationDescription)).nullable(),
      certificate_url: Yup.string().url("Invalid URL").max(LIMITS.certificateUrl, atMost(LIMITS.certificateUrl)).nullable(),
      // An empty date input gives "", which is "no date" rather than an invalid one.
      issued_at: Yup.date()
        .transform((value, original) => (original === "" ? null : value))
        .typeError("Invalid date")
        .nullable(),
    })
  ),
});
