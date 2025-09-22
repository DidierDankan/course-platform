import { useEffect } from "react";
import { useFormikContext } from "formik";
import Select, { components } from "react-select";
import { prefixes } from "@utils/prefix";

const getFlagEmoji = (iso) =>
  iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));

const phoneOptions = prefixes.map(({ country, code, iso }) => ({
  label: `${getFlagEmoji(iso)} ${iso}`, // ✅ show flag + ISO
  value: code,
  iso,
  flag: getFlagEmoji(iso),
  country, // still available if needed
}));

const CustomOption = (props) => (
  <components.Option {...props}>
    <span className="mr-2">{props.data.flag}</span>
    <span className="font-medium">{props.data.iso}</span>
    <span className="text-gray-500 ml-2">{props.data.value}</span>
  </components.Option>
);

const CustomSingleValue = (props) => (
  <components.SingleValue {...props}>
    <span className="mr-2">{props.data.flag}</span>
    <span className="font-medium">{props.data.iso}</span>
  </components.SingleValue>
);

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#999" : "#ccc",
    boxShadow: state.isFocused ? "0 0 0 1px #999" : "none",
    "&:hover": { borderColor: "#999" },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "white",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "black",
    backgroundColor: state.isFocused ? "#f0f0f0" : "white",
    cursor: "pointer",
    fontSize: "0.9rem",
  }),
};

const PhoneInputField = () => {
  const { values, setFieldValue } = useFormikContext();

  // Extract prefix & number from stored value
  const match = values.phone?.match(/^\((\+\d+)\)(.*)$/);
  const storedPrefix = match ? match[1] : "";
  const numberWithoutPrefix = match ? match[2] : "";

  const selectedOption = phoneOptions.find((opt) => opt.value === storedPrefix);

  // Auto-detect country ISO if no value yet
  useEffect(() => {
    if (!values.phone) {
      const browserLang = navigator.language || navigator.userLanguage;
      const countryCode = browserLang.split("-")[1]?.toUpperCase();
      const match = phoneOptions.find((opt) => opt.iso === countryCode);

      if (match) {
        setFieldValue("phone", `(${match.value})`);
      }
    }
  }, [values.phone, setFieldValue]);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm">Phone Number</label>

      <div className="flex gap-2">
        {/* Country Select */}
        <div className="w-80">
          <Select
            options={phoneOptions}
            value={selectedOption || null}
            onChange={(selected) => {
              setFieldValue("phone", `(${selected.value})${numberWithoutPrefix}`);
            }}
            isSearchable
            placeholder="Select"
            classNamePrefix="react-select"
            styles={selectStyles}
            components={{
              Option: CustomOption,
              SingleValue: CustomSingleValue,
            }}
          />
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          className="input flex-1"
          placeholder="Phone number"
          value={numberWithoutPrefix}
          onChange={(e) =>
            setFieldValue(
              "phone",
              `(${selectedOption ? selectedOption.value : ""})${e.target.value}`
            )
          }
        />
      </div>
    </div>
  );
};

export default PhoneInputField;
