import React, { useState } from "react";
import { Award, GraduationCap, FileText, ScrollText, Link2, ChevronDown } from "lucide-react";

const ICONS = [Award, GraduationCap, FileText, ScrollText];

const prettyDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
  } catch {
    return iso;
  }
};
const ensureHttp = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const QualificationsAccordion = ({ items = [] }) => {
  const [openIdx, setOpenIdx] = useState(null);

  if (!items?.length) return <p className="text-gray-500 text-sm">No qualifications yet.</p>;

  return (
    <div className="rounded-lg border border-gray-200 divide-y bg-white dark:bg-neutral-900 dark:border-neutral-800">
      {items.map((q, idx) => {
        const Icon = ICONS[idx % ICONS.length];
        const isOpen = openIdx === idx;
        return (
          <div key={idx}>
            {/* Header */}
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/60"
              aria-expanded={isOpen}
              aria-controls={`qa-panel-${idx}`}
              id={`qa-head-${idx}`}
            >
              <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full border ${isOpen ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-white dark:bg-neutral-800 dark:border-neutral-700"}`}>
                <Icon size={18} className={isOpen ? "text-emerald-600" : "text-blue-600"} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{q?.title || "Untitled"}</span>
                  {q?.institution && <span className="text-gray-500 text-sm truncate">• {q.institution}</span>}
                </div>
                {(q?.issued_at || q?.certificate_url) && (
                  <div className="text-xs text-gray-500">
                    {q?.issued_at && <>Issued {prettyDate(q.issued_at)}</>}
                    {q?.issued_at && q?.certificate_url && " • "}
                    {q?.certificate_url && "Certificate available"}
                  </div>
                )}
              </div>
              <ChevronDown size={18} className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Content (no animation, just show/hide) */}
            {isOpen && (
              <div
                id={`qa-panel-${idx}`}
                role="region"
                aria-labelledby={`qa-head-${idx}`}
                className="px-4 pb-4 pt-0 text-sm text-gray-800 dark:text-gray-200 space-y-3"
              >
                {q?.description && <p className="leading-relaxed">{q.description}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q?.issued_at && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Issued</div>
                      <div className="font-medium">{prettyDate(q.issued_at)}</div>
                    </div>
                  )}
                  {q?.certificate_url && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Certificate</div>
                      <a
                        href={ensureHttp(q.certificate_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline break-all"
                      >
                        <Link2 size={16} /> View Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QualificationsAccordion;
