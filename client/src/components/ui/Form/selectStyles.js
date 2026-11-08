// react-select styles itself with inline styles, so its colors can't come from a stylesheet.
// These are CSS variables rather than values, so the dropdowns still follow the active theme.
const lineColor = (state) => (state.isFocused ? "var(--lm-focus)" : "var(--lm-field-line)");

export const themedSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 50,
    backgroundColor: "var(--lm-field-bg)",
    borderColor: lineColor(state),
    borderWidth: "var(--lm-border-w)",
    borderRadius: "var(--lm-radius-input)",
    boxShadow: "var(--lm-shadow-field)",
    "&:hover": { borderColor: lineColor(state) },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    backgroundColor: "var(--lm-surface)",
    border: "var(--lm-border-w) solid var(--lm-field-line)",
    borderRadius: "var(--lm-radius-input)",
  }),
  option: (base, state) => ({
    ...base,
    color: "var(--lm-ink)",
    backgroundColor: state.isFocused ? "var(--lm-surface-2)" : "var(--lm-surface)",
    cursor: "pointer",
  }),
  singleValue: (base) => ({ ...base, color: "var(--lm-ink)" }),
  input: (base) => ({ ...base, color: "var(--lm-ink)" }),
  placeholder: (base) => ({ ...base, color: "var(--lm-placeholder)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "var(--lm-muted)" }),
  clearIndicator: (base) => ({ ...base, color: "var(--lm-muted)" }),
  noOptionsMessage: (base) => ({ ...base, color: "var(--lm-muted)" }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--lm-surface-2)",
    border: "var(--lm-border-w) solid var(--lm-line-strong)",
    borderRadius: "var(--lm-radius-label)",
  }),
  multiValueLabel: (base) => ({ ...base, color: "var(--lm-ink)" }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--lm-muted)",
    ":hover": { backgroundColor: "transparent", color: "var(--lm-danger)" },
  }),
};
