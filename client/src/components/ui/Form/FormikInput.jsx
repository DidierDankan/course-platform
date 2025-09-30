import { Field, ErrorMessage } from "formik";

const FormikInput = ({ name, label, type = "text", as = "input", className = "input" }) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={name} className="mb-1 font-medium">
          {label}
        </label>
      )}

      <Field
        id={name}
        name={name}
        type={type}
        as={as}
        className={className}
      />

      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );
};

export default FormikInput;
