import Select from "react-select";
import { ErrorMessage, useFormikContext } from "formik";

import { skills } from "@utils/skills";
import { themedSelectStyles } from "./selectStyles";

const SkillsSelectionField = () => {
  const { values, setFieldValue } = useFormikContext();

  // Normalize skills array (supports strings or pre-built { value, label })
  const normalizedOptions = skills.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Exclude already selected skills from options
  const availableOptions = normalizedOptions.filter(
    (opt) => !values.skills.includes(opt.value)
  );

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">Skills</label>

      <Select
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

      <ErrorMessage
        name="skills"
        component="div"
        className="text-red-500 text-sm"
      />
    </div>
  );
};

export default SkillsSelectionField;
