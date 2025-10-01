import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';

import { handleLoginSubmit } from '@utils/form/auth/registerHandler';
import { useLoginMutation } from '@api/modules/authApi';

import { LoginSchema } from '@utils/form/auth/registerValidation';

const Login = () => {
  const navigate = useNavigate();
  const [LoginUser, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLoginSubmit(LoginUser, navigate, dispatch)}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <Field
                    type="email"
                    name="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <Field
                    type="password"
                    name="password"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition mt-[15px]"
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
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
    </div>
  );
};

export default Login;
