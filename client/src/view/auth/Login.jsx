import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { handleLoginSubmit } from '@utils/form/auth/registerHandler';
import { useLoginMutation } from '@api/modules/authApi';
import { LoginSchema } from '@utils/form/auth/registerValidation';
import { BookOpen } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [LoginUser, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const location = useLocation();
  const from = location.state?.from || "/";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a]">
      {/* Hero-style header for consistency */}
      <section className="max-w-[500px] mx-auto w-full px-[16px] flex-1 flex flex-col justify-center">
        <div className="text-center mb-[24px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Welcome back to LearnHub</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-[1.15] text-[#1e293b]">
            Sign in to your account
          </h1>
          <p className="mt-[6px] text-[14px] text-[#475569]">
            Continue learning where you left off.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[16px] p-[28px] sm:p-[32px]">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLoginSubmit(LoginUser, navigate, dispatch, from)}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-[16px]">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[14px] font-medium text-[#334155] mb-[4px]"
                  >
                    Email
                  </label>
                  <Field
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full px-[12px] py-[10px] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-[#b91c1c] text-[13px] mt-[2px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[14px] font-medium text-[#334155] mb-[4px]"
                  >
                    Password
                  </label>
                  <Field
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full px-[12px] py-[10px] border border-[#cbd5e1] rounded-[8px] text-[14px] focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-[#b91c1c] text-[13px] mt-[2px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-[10px] rounded-[8px] font-semibold text-[14px] shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition"
                >
                  {isSubmitting || isLoading ? 'Logging in...' : 'Login'}
                </button>

                <Link to="/" className="block">
                  <button
                    type="button"
                    className="w-full mt-[10px] bg-[#e2e8f0] text-[#334155] py-[10px] rounded-[8px] font-medium hover:bg-[#cbd5e1] transition"
                  >
                    Back to Home
                  </button>
                </Link>
              </Form>
            )}
          </Formik>
        </div>

        {/* Small sign-up hint */}
        <p className="text-center text-[14px] text-[#475569] mt-[18px]">
          Don’t have an account?{' '}
          <Link
            to="/auth/register"
            className="text-[#4f46e5] font-medium hover:underline"
          >
            Register here
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
