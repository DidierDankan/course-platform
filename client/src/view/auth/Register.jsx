import { Formik, Form, Field, ErrorMessage } from "formik";
import { useRegisterMutation } from "@api/modules/authApi";
import { Link, useNavigate } from "react-router-dom";
import { RegisterSchema } from "@utils/form/auth/registerValidation";
import { handleRegisterSubmit } from "@utils/form/auth/registerHandler";
import FormField from "@components/ui/Form/FormField";
import { APP_NAME } from "@utils/brand";

const ROLES = [
  { value: "user", label: "Student" },
  { value: "seller", label: "Instructor" },
];
const PASSWORD_HINT = "At least 6 characters, with a number and one of !@#$%^&*";

export default function Register() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  return (
    <main className="page-main page-main-form">
      <header className="page-heading">
        <span className="section-index">Join {APP_NAME}</span>
        <h1>Create your account</h1>
        <p>Start your journey as a learner or a course creator.</p>
      </header>

      <section className="panel">
        <Formik
          initialValues={{ email: "", password: "", role: "user" }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegisterSubmit(registerUser, navigate)}
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
                  autoComplete="new-password"
                  hint={PASSWORD_HINT}
                />

                <fieldset className="role-field">
                  <legend>I want to join as</legend>
                  <div className="role-options">
                    {ROLES.map((role) => (
                      <label key={role.value} className="role-option">
                        <Field type="radio" name="role" value={role.value} />
                        <span>{role.label}</span>
                      </label>
                    ))}
                  </div>
                  <ErrorMessage name="role" component="small" />
                </fieldset>

                <button
                  type="submit"
                  className={`button button-primary ${busy ? "is-loading" : ""}`}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy && <span className="spinner" aria-hidden="true" />}
                  {busy ? "Creating your account…" : "Create account"}
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
        Already have an account? <Link to="/auth/login">Sign in here</Link>
      </p>
    </main>
  );
}
