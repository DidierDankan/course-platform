import { useField } from "formik";

// A Formik text field in the design system's .field markup. The <label> wraps the input, so clicking
// the label focuses it and screen readers announce the name. An error replaces the hint once touched.
// The message line is always rendered: its reserved height stops the form from jumping when an error
// appears, which would move the submit button out from under a click.
export default function FormField({ label, hint, name, type = "text", ...inputProps }) {
  const [field, meta] = useField({ name, type });
  const error = meta.touched ? meta.error : undefined;
  const messageId = `${name}-message`;
  const message = error || hint;

  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      <input
        {...field}
        {...inputProps}
        type={type}
        aria-invalid={!!error}
        aria-describedby={message ? messageId : undefined}
      />
      <small id={messageId}>{message}</small>
    </label>
  );
}
