import Select from "react-select";
import { ErrorMessage, useFormikContext } from "formik";

import { skills } from "@utils/skills";

const selectionStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'white', // field background
    borderColor: state.isFocused ? '#999' : '#ccc',
    boxShadow: state.isFocused ? '0 0 0 1px #999' : 'none',
    '&:hover': { borderColor: '#999' },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'white', // dropdown background
    zIndex: 50, // keeps it on top of other elements
  }),
  option: (base, state) => ({
    ...base,
    color: 'black', // text color
    backgroundColor: state.isFocused ? '#f0f0f0' : 'white', // light gray on hover
    cursor: 'pointer',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e5e7eb', // Tailwind's gray-200 for selected chips
    color: '#111',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#111',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#555',
    ':hover': { backgroundColor: '#ccc', color: 'black' },
  }),
};

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
        styles={selectionStyles}
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
