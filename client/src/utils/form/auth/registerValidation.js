import * as Yup from 'yup';

export const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
  password: Yup.string()
    .min(6, 'Too short')
    .matches(/[0-9]/, 'Must include a number')
    .matches(/[!@#$%^&*]/, 'Must include a special character')
    .required('Required'),
  role: Yup.string()
    .oneOf(['user', 'seller'], 'Invalid role')
    .required('Role is required'),
});

export const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});
