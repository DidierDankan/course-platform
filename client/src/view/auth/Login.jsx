import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Formik, Form } from "formik";
import { handleLoginSubmit } from "@utils/form/auth/registerHandler";
import { useLoginMutation } from "@api/modules/authApi";
import { LoginSchema } from "@utils/form/auth/registerValidation";
import FormField from "@components/ui/Form/FormField";
import { APP_NAME } from "@utils/brand";

const Login = () => {
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const location = useLocation();
  const from = location.state?.from || "/";

  return (
    <main className="page-main page-main-form">
      <header className="page-heading">
        <span className="section-index">Welcome back to {APP_NAME}</span>
        <h1>Sign in to your account</h1>
        <p>Continue learning where you left off.</p>
      </header>

      <section className="panel">
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleLoginSubmit(loginUser, navigate, dispatch, from)}
        >
          {({ isSubmitting, status }) => {
            const busy = isSubmitting || isLoading;
            return (
              <Form className="auth-form" noValidate>
                {status && (
                  <p className="form-alert" role="alert">
                    {status}
                  </p>
                )}
                <FormField label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className={`button button-primary ${busy ? "is-loading" : ""}`}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy && <span className="spinner" aria-hidden="true" />}
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <Link to="/" className="button button-ghost">
                  Back to Home
                </Link>
              </Form>
            );
          }}
        </Formik>
      </section>

      <p className="auth-hint">
        Don&apos;t have an account? <Link to="/auth/register">Register here</Link>
      </p>
    </main>
  );
};

export default Login;
