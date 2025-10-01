import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useRegisterMutation } from '@api/modules/authApi';
import { Link, useNavigate } from 'react-router-dom';

import { RegisterSchema } from '@utils/form/auth/registerValidation';
import { handleRegisterSubmit } from '@utils/form/auth/registerHandler';

export default function Register() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md mx-auto mt-10 p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Register</h1>

        <Formik
          initialValues={{ email: '', password: '', role: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegisterSubmit(registerUser, navigate)}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {/* Email Field */}
              <div>
                <label>Email</label>
                <Field name="email" type="email" className="input w-full p-2 border rounded" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Password Field */}
              <div>
                <label>Password</label>
                <Field name="password" type="password" className="input w-full p-2 border rounded" />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Role Selection - Radio Buttons */}
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <Field type="radio" name="role" value="user" className="accent-blue-600" />
                    <span>User</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Field type="radio" name="role" value="seller" className="accent-blue-600" />
                    <span>Seller</span>
                  </label>
                </div>
                <ErrorMessage name="role" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-blue-600 text-white py-2 px-4 rounded w-full mt-[15px]"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
              <Link
                to="/"
              >
                <button className="w-full block text-center bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition no-underline mt-[10px]">
                  Back
                </button>
              </Link>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
