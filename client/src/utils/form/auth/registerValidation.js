import * as Yup from 'yup';
import { LIMITS, PASSWORD_MAX_BYTES, byteLength } from '@utils/form/limits';

export const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Invalid email')
    .max(LIMITS.email, `${LIMITS.email} characters at most`)
    .required('Required'),
  password: Yup.string()
    .min(6, 'Too short')
    .test('max-bytes', 'Too long: use fewer or simpler characters', (value) => byteLength(value) <= PASSWORD_MAX_BYTES)
    .matches(/[0-9]/, 'Must include a number')
    .matches(/[!@#$%^&*]/, 'Must include a special character')
    .required('Required'),
  role: Yup.string()
    .oneOf(['user', 'seller'], 'Invalid role')
    .required('Role is required'),
});

export const LoginSchema = Yup.object().shape({
  email: Yup.string().trim().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});
