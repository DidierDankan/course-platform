import * as Yup from 'yup';

export const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().required('Full name is required'),
  bio: Yup.string().required('Bio is required'),
  phone: Yup.string().required('Phone number is required'),
  website: Yup.string().url('Invalid URL').nullable(),
  profile_image: Yup.string().nullable(),

  skills: Yup.array().of(Yup.string()).min(1, 'Add at least one skill'),

  qualifications: Yup.array().of(
    Yup.object().shape({
      title: Yup.string(),
      institution: Yup.string(),
      description: Yup.string().nullable(),
      certificate_url: Yup.string().url('Invalid URL').nullable(),
      issued_at: Yup.date(),
    })
  ),
});