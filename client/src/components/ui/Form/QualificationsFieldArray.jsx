import { useState } from "react";
import { FieldArray, getIn } from "formik";
import { FileText, Plus } from "lucide-react";
import Modal from "@components/ui/Modal";
import FormField from "./FormField";

const EMPTY_QUALIFICATION = {
  title: "",
  institution: "",
  description: "",
  certificate_url: "",
  issued_at: "",
};

const QualificationsFieldArray = ({ name = "qualifications" }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <FieldArray name={name}>
      {({ push, remove, form }) => {
        const items = form.values[name] || [];
        const selected = openIndex !== null ? items[openIndex] : null;
        const hasErrorAt = (index) => !!getIn(form.errors, `${name}[${index}]`);
        // The fields live in a closed popup, so an invalid one has to be pointed out from here.
        const showHint = form.submitCount > 0 && items.some((_, index) => hasErrorAt(index));

        return (
          <div>
            <div className="form-section-head">
              <span className="field-label">Qualifications</span>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => {
                  push(EMPTY_QUALIFICATION);
                  setOpenIndex(items.length);
                }}
              >
                <Plus size={16} aria-hidden="true" /> Add
              </button>
            </div>

            {items.length === 0 ? (
              <p className="panel-note">No qualifications added yet.</p>
            ) : (
              <div className="chip-list">
                {items.map((q, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`chip ${hasErrorAt(index) ? "has-error" : ""}`}
                    onClick={() => setOpenIndex(index)}
                  >
                    <FileText size={16} aria-hidden="true" />
                    {q?.title || `Qualification ${index + 1}`}
                  </button>
                ))}
              </div>
            )}
            {showHint && <small className="field-message is-error">Open the highlighted qualification to fix it.</small>}

            <Modal
              open={openIndex !== null && !!selected}
              onClose={() => setOpenIndex(null)}
              title="Edit qualification"
              footer={
                <>
                  <button
                    type="button"
                    className="text-button-danger"
                    onClick={() => {
                      remove(openIndex);
                      setOpenIndex(null);
                    }}
                  >
                    Delete
                  </button>
                  <button type="button" className="button button-primary button-small" onClick={() => setOpenIndex(null)}>
                    Done
                  </button>
                </>
              }
            >
              {openIndex !== null && (
                <div className="seller-form">
                  <FormField name={`${name}[${openIndex}].title`} label="Title" />
                  <FormField name={`${name}[${openIndex}].institution`} label="Institution" />
                  <FormField name={`${name}[${openIndex}].description`} label="Description" as="textarea" rows={4} />
                  <FormField name={`${name}[${openIndex}].certificate_url`} label="Certificate URL" />
                  <FormField name={`${name}[${openIndex}].issued_at`} label="Issued on" type="date" />
                </div>
              )}
            </Modal>
          </div>
        );
      }}
    </FieldArray>
  );
};

export default QualificationsFieldArray;
