import * as Yup from "yup";

export const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().required("Full name is required"),
  bio: Yup.string().required("Bio is required"),
  phone: Yup.string().required("Phone number is required"),
  website: Yup.string().url("Invalid URL").nullable(),
  // A stored file name, or a File when a new photo was picked.
  profile_image: Yup.mixed().nullable(),

  skills: Yup.array().of(Yup.string()).min(1, "Add at least one skill"),

  qualifications: Yup.array().of(
    Yup.object().shape({
      title: Yup.string().max(100, "100 characters at most").required("Title is required"),
      institution: Yup.string().max(100, "100 characters at most").nullable(),
      description: Yup.string().nullable(),
      certificate_url: Yup.string().url("Invalid URL").nullable(),
      // An empty date input gives "", which is "no date" rather than an invalid one.
      issued_at: Yup.date()
        .transform((value, original) => (original === "" ? null : value))
        .typeError("Invalid date")
        .nullable(),
    })
  ),
});
