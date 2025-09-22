import { useState } from "react";
import { Field, FieldArray, ErrorMessage } from "formik";
import Modal from "./Modal"; // adjust import path

const QualificationsFieldArray = ({ name = "qualifications" }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <FieldArray name={name}>
      {({ push, remove, form }) => {
        const items = form.values[name] || [];

        const handleAdd = () => {
          const idx = items.length;
          push({
            title: "",
            institution: "",
            description: "",
            certificate_url: "",
            issued_at: "",
          });
          setOpenIndex(idx);
        };

        const selected = openIndex !== null ? items[openIndex] : null;

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Qualifications</h3>
              <button type="button" className="btn btn-sm" onClick={handleAdd}>
                + Add
              </button>
            </div>

            {/* Icon Row */}
            <div className="flex flex-wrap gap-2">
              {items.length === 0 && (
                <p className="text-gray-500 text-sm">No qualifications added yet.</p>
              )}
              {items.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpenIndex(idx)}
                  title={q?.title || `Qualification ${idx + 1}`}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                >
                  {/* simple doc icon (no extra deps) */}
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>

                  {/* tiny index badge */}
                  <span className="absolute -top-1 -right-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Modal */}
            <Modal
              open={openIndex !== null && !!selected}
              onClose={() => setOpenIndex(null)}
              title="Edit Qualification"
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      remove(openIndex);
                      setOpenIndex(null);
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(null)}
                    className="btn btn-primary"
                  >
                    Done
                  </button>
                </>
              }
            >
              {openIndex !== null && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block mb-1 font-medium">Title</label>
                    <Field
                      name={`${name}[${openIndex}].title`}
                      className="input w-full"
                    />
                    <ErrorMessage
                      name={`${name}[${openIndex}].title`}
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block mb-1 font-medium">Institution</label>
                    <Field
                      name={`${name}[${openIndex}].institution`}
                      className="input w-full"
                    />
                    <ErrorMessage
                      name={`${name}[${openIndex}].institution`}
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 font-medium">Description</label>
                    <Field
                      as="textarea"
                      name={`${name}[${openIndex}].description`}
                      className="input w-full"
                      rows={4}
                    />
                  </div>

                  {/* Certificate URL */}
                  <div>
                    <label className="block mb-1 font-medium">Certificate URL</label>
                    <Field
                      name={`${name}[${openIndex}].certificate_url`}
                      className="input w-full"
                    />
                  </div>

                  {/* Issued At */}
                  <div>
                    <label className="block mb-1 font-medium">Issued At</label>
                    <Field
                      type="date"
                      name={`${name}[${openIndex}].issued_at`}
                      className="input w-full"
                    />
                    <ErrorMessage
                      name={`${name}[${openIndex}].issued_at`}
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
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
