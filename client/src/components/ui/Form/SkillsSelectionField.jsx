import Select from "react-select";
import { useFormikContext } from "formik";

import { skills } from "@utils/skills";
import { themedSelectStyles } from "./selectStyles";

const SkillsSelectionField = () => {
  const { values, errors, touched, setFieldValue } = useFormikContext();
  const error = touched.skills ? errors.skills : undefined;

  // Normalize skills array (supports strings or pre-built { value, label })
  const normalizedOptions = skills.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Exclude already selected skills from options
  const availableOptions = normalizedOptions.filter(
    (opt) => !values.skills.includes(opt.value)
  );

  return (
    <div>
      <span className="field-label">Skills</span>
      <Select
        aria-label="Skills"
        isMulti
        isSearchable
        options={availableOptions}
        value={values.skills.map((skill) => ({ value: skill, label: skill }))}
        onChange={(selected) =>
          setFieldValue(
            "skills",
            selected ? selected.map((opt) => opt.value) : []
          )
        }
        placeholder="Type or select skills..."
        styles={themedSelectStyles}
        classNamePrefix="react-select"
      />
      <small className={`field-message ${error ? "is-error" : ""}`}>{error}</small>
    </div>
  );
};

export default SkillsSelectionField;
